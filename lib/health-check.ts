import { connectDB } from "./mongodb";
import { Resource, type IResource } from "@/models/Resource";
import { HealthCheckLog } from "@/models/HealthCheckLog";
import mongoose from "mongoose";

export interface HealthCheckResult {
  resourceId: string;
  name: string;
  url: string;
  status: number | null;
  responseTimeMs: number | null;
  isHealthy: boolean;
  error?: string;
}

export interface DailyUptimeEntry {
  date: string;
  totalChecks: number;
  healthyChecks: number;
  avgResponseTimeMs: number | null;
  status: "up" | "degraded" | "down" | "unknown";
}

export interface ResourceUptimeData {
  resourceId: string;
  uptimePercentage: number;
  dailyHistory: DailyUptimeEntry[];
}

export async function checkResourceHealth(
  resource: IResource,
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 120_000);

    const res = await fetch(resource.url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    const responseTimeMs = Date.now() - start;
    const isHealthy = res.status === resource.healthCheck.expectedStatus;

    return {
      resourceId: resource._id.toString(),
      name: resource.name,
      url: resource.url,
      status: res.status,
      responseTimeMs,
      isHealthy,
    };
  } catch (err) {
    return {
      resourceId: resource._id.toString(),
      name: resource.name,
      url: resource.url,
      status: null,
      responseTimeMs: Date.now() - start,
      isHealthy: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runAllHealthChecks(
  force = false,
): Promise<HealthCheckResult[]> {
  await connectDB();

  const resources = await Resource.find({
    isActive: true,
    "healthCheck.enabled": true,
  });

  const now = new Date();
  const results: HealthCheckResult[] = [];

  for (const resource of resources) {
    if (!force && resource.healthCheck.lastCheckedAt) {
      const elapsed = now.getTime() - new Date(resource.healthCheck.lastCheckedAt).getTime();
      const intervalMs = resource.healthCheck.intervalMinutes * 60 * 1000;
      if (elapsed < intervalMs) continue;
    }

    const result = await checkResourceHealth(resource);
    const checkedAt = new Date();

    await Resource.updateOne(
      { _id: resource._id },
      {
        $set: {
          "healthCheck.lastCheckedAt": checkedAt,
          "healthCheck.lastStatus": result.status,
          "healthCheck.lastResponseTimeMs": result.responseTimeMs,
          "healthCheck.isHealthy": result.isHealthy,
        },
      },
    );

    await HealthCheckLog.create({
      resourceId: resource._id,
      status: result.status,
      responseTimeMs: result.responseTimeMs,
      isHealthy: result.isHealthy,
      error: result.error,
      checkedAt,
    });

    results.push(result);
  }

  return results;
}

export async function getUptimeData(
  resourceIds: string[],
  thresholds: Map<string, number>,
): Promise<Map<string, ResourceUptimeData>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const objectIds = resourceIds.map((id) => new mongoose.Types.ObjectId(id));

  const pipeline = [
    {
      $match: {
        resourceId: { $in: objectIds },
        checkedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          resourceId: "$resourceId",
          day: { $dateToString: { format: "%Y-%m-%d", date: "$checkedAt" } },
        },
        totalChecks: { $sum: 1 },
        healthyChecks: { $sum: { $cond: ["$isHealthy", 1, 0] } },
        avgResponseTimeMs: { $avg: "$responseTimeMs" },
      },
    },
    {
      $sort: { "_id.day": 1 as const },
    },
    {
      $group: {
        _id: "$_id.resourceId",
        days: {
          $push: {
            date: "$_id.day",
            totalChecks: "$totalChecks",
            healthyChecks: "$healthyChecks",
            avgResponseTimeMs: "$avgResponseTimeMs",
          },
        },
        totalChecksAll: { $sum: "$totalChecks" },
        healthyChecksAll: { $sum: "$healthyChecks" },
      },
    },
  ];

  const results = await HealthCheckLog.aggregate(pipeline);

  const uptimeMap = new Map<string, ResourceUptimeData>();

  for (const id of resourceIds) {
    uptimeMap.set(id, {
      resourceId: id,
      uptimePercentage: 0,
      dailyHistory: buildEmptyHistory(),
    });
  }

  for (const row of results) {
    const resourceId = row._id.toString();
    const threshold = thresholds.get(resourceId) ?? 1000;
    const uptimePercentage =
      row.totalChecksAll > 0
        ? Math.round((row.healthyChecksAll / row.totalChecksAll) * 10000) / 100
        : 0;

    const dayMap = new Map<string, DailyUptimeEntry>();

    for (const day of row.days) {
      const avgMs =
        day.avgResponseTimeMs != null
          ? Math.round(day.avgResponseTimeMs)
          : null;
      let status: DailyUptimeEntry["status"] = "unknown";

      if (day.totalChecks > 0) {
        const ratio = day.healthyChecks / day.totalChecks;
        if (ratio >= 0.9) {
          status = avgMs != null && avgMs > threshold ? "degraded" : "up";
        } else if (ratio > 0) {
          status = "degraded";
        } else {
          status = "down";
        }
      }

      dayMap.set(day.date, {
        date: day.date,
        totalChecks: day.totalChecks,
        healthyChecks: day.healthyChecks,
        avgResponseTimeMs: avgMs,
        status,
      });
    }

    const history = buildEmptyHistory();
    for (let i = 0; i < history.length; i++) {
      const existing = dayMap.get(history[i].date);
      if (existing) history[i] = existing;
    }

    uptimeMap.set(resourceId, {
      resourceId,
      uptimePercentage,
      dailyHistory: history,
    });
  }

  return uptimeMap;
}

function buildEmptyHistory(): DailyUptimeEntry[] {
  const history: DailyUptimeEntry[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    history.push({
      date: d.toISOString().slice(0, 10),
      totalChecks: 0,
      healthyChecks: 0,
      avgResponseTimeMs: null,
      status: "unknown",
    });
  }
  return history;
}
