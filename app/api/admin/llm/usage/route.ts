import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/mongodb";
import { LlmUsage } from "@/models/LlmUsage";
import { subDays, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = startOfDay(subDays(now, 30));
    const sevenDaysAgo = startOfDay(subDays(now, 7));
    const oneDayAgo = startOfDay(subDays(now, 1));

    const [
      allTimeAgg,
      last30dAgg,
      last7dAgg,
      last24hAgg,
      byModel,
      bySource,
      dailyBreakdown,
      recentRequests,
    ] = await Promise.all([
      LlmUsage.aggregate([
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalInputTokens: { $sum: "$inputTokens" },
            totalOutputTokens: { $sum: "$outputTokens" },
            totalCost: { $sum: "$costUsd" },
          },
        },
      ]),

      LlmUsage.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalInputTokens: { $sum: "$inputTokens" },
            totalOutputTokens: { $sum: "$outputTokens" },
            totalCost: { $sum: "$costUsd" },
          },
        },
      ]),

      LlmUsage.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalInputTokens: { $sum: "$inputTokens" },
            totalOutputTokens: { $sum: "$outputTokens" },
            totalCost: { $sum: "$costUsd" },
          },
        },
      ]),

      LlmUsage.aggregate([
        { $match: { createdAt: { $gte: oneDayAgo } } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalInputTokens: { $sum: "$inputTokens" },
            totalOutputTokens: { $sum: "$outputTokens" },
            totalCost: { $sum: "$costUsd" },
          },
        },
      ]),

      LlmUsage.aggregate([
        {
          $group: {
            _id: "$llmModel",
            requests: { $sum: 1 },
            inputTokens: { $sum: "$inputTokens" },
            outputTokens: { $sum: "$outputTokens" },
            cost: { $sum: "$costUsd" },
          },
        },
        { $sort: { cost: -1 } },
      ]),

      LlmUsage.aggregate([
        {
          $group: {
            _id: "$source",
            requests: { $sum: 1 },
            inputTokens: { $sum: "$inputTokens" },
            outputTokens: { $sum: "$outputTokens" },
            cost: { $sum: "$costUsd" },
          },
        },
        { $sort: { cost: -1 } },
      ]),

      LlmUsage.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            requests: { $sum: 1 },
            inputTokens: { $sum: "$inputTokens" },
            outputTokens: { $sum: "$outputTokens" },
            cost: { $sum: "$costUsd" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      LlmUsage.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select("llmModel inputTokens outputTokens costUsd source createdAt")
        .lean(),
    ]);

    const emptyAgg = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    };

    return NextResponse.json({
      allTime: allTimeAgg[0] ?? emptyAgg,
      last30d: last30dAgg[0] ?? emptyAgg,
      last7d: last7dAgg[0] ?? emptyAgg,
      last24h: last24hAgg[0] ?? emptyAgg,
      byModel: byModel.map((m: any) => ({
        model: m._id,
        requests: m.requests,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        cost: m.cost,
      })),
      bySource: bySource.map((s: any) => ({
        source: s._id,
        requests: s.requests,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        cost: s.cost,
      })),
      dailyBreakdown: dailyBreakdown.map((d: any) => ({
        date: d._id,
        requests: d.requests,
        inputTokens: d.inputTokens,
        outputTokens: d.outputTokens,
        cost: d.cost,
      })),
      recentRequests: recentRequests.map((r: any) => ({
        _id: String(r._id),
        llmModel: r.llmModel,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        costUsd: r.costUsd,
        source: r.source,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching LLM usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch LLM usage stats" },
      { status: 500 },
    );
  }
}
