"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CircleDollarSign,
  Hash,
  Zap,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface AggBucket {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

interface ModelBreakdown {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface SourceBreakdown {
  source: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface DailyPoint {
  date: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface RecentRequest {
  _id: string;
  llmModel: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  source: string;
  createdAt: string;
}

interface UsageData {
  allTime: AggBucket;
  last30d: AggBucket;
  last7d: AggBucket;
  last24h: AggBucket;
  byModel: ModelBreakdown[];
  bySource: SourceBreakdown[];
  dailyBreakdown: DailyPoint[];
  recentRequests: RecentRequest[];
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatCost(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function BarSegment({
  value,
  max,
  label,
  sublabel,
  color,
}: {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate mr-2">{label}</span>
        <span className="font-medium tabular-nums shrink-0">{sublabel}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  );
}

function SparkLine({ data, height = 40 }: { data: number[]; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 200;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${height} ${points} ${w},${height}`}
        fill="var(--color-accent)"
        fillOpacity="0.08"
        stroke="none"
      />
    </svg>
  );
}

export function LlmUsageDashboard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<
    "last24h" | "last7d" | "last30d" | "allTime"
  >("last30d");

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/admin/llm/usage");
      if (response.ok) {
        const json = await response.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch LLM usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-40 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Failed to load usage data</p>
      </div>
    );
  }

  const active = data[timeRange];
  const rangeLabels = {
    last24h: "24h",
    last7d: "7d",
    last30d: "30d",
    allTime: "All",
  } as const;

  const maxModelCost = Math.max(...data.byModel.map((m) => m.cost), 0);
  const maxSourceCost = Math.max(...data.bySource.map((s) => s.cost), 0);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Time range selector */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        {(
          ["last24h", "last7d", "last30d", "allTime"] as const
        ).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              timeRange === range
                ? "bg-background text-accent-strong shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {rangeLabels[range]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Requests
            </p>
            <Hash className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {active.totalRequests.toLocaleString()}
          </p>
          {timeRange !== "allTime" && data.allTime.totalRequests > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              of {data.allTime.totalRequests.toLocaleString()} total
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Input Tokens
            </p>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatTokens(active.totalInputTokens)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {active.totalInputTokens.toLocaleString()} exact
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Output Tokens
            </p>
            <ArrowDownRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatTokens(active.totalOutputTokens)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {active.totalOutputTokens.toLocaleString()} exact
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Cost
            </p>
            <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatCost(active.totalCost)}
          </p>
          {timeRange !== "allTime" && data.allTime.totalCost > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCost(data.allTime.totalCost)} total
            </p>
          )}
        </Card>
      </div>

      {/* Daily activity spark chart */}
      {data.dailyBreakdown.length > 1 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Daily Activity</h3>
              <p className="text-xs text-muted-foreground">
                Last 30 days — requests per day
              </p>
            </div>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <SparkLine
            data={data.dailyBreakdown.map((d) => d.requests)}
            height={56}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {format(
                new Date(data.dailyBreakdown[0].date),
                "MMM d",
              )}
            </span>
            <span>
              {format(
                new Date(
                  data.dailyBreakdown[data.dailyBreakdown.length - 1].date,
                ),
                "MMM d",
              )}
            </span>
          </div>
        </Card>
      )}

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Model */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">By Model</h3>
            <Brain className="w-4 h-4 text-muted-foreground" />
          </div>
          {data.byModel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No data yet
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.byModel.map((m) => (
                <BarSegment
                  key={m.model}
                  label={m.model}
                  sublabel={`${formatCost(m.cost)} · ${m.requests} req`}
                  value={m.cost}
                  max={maxModelCost}
                  color="bg-accent"
                />
              ))}
            </div>
          )}
        </Card>

        {/* By Source */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">By Source</h3>
            <Hash className="w-4 h-4 text-muted-foreground" />
          </div>
          {data.bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No data yet
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.bySource.map((s) => (
                <BarSegment
                  key={s.source}
                  label={s.source}
                  sublabel={`${formatCost(s.cost)} · ${formatTokens(s.inputTokens + s.outputTokens)} tok`}
                  value={s.cost}
                  max={maxSourceCost}
                  color="bg-accent-strong"
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent requests table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Recent Requests</h3>
        {data.recentRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No requests yet
          </p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground px-5 py-2">
                    Time
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Model
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Source
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-2">
                    In
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-2">
                    Out
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-5 py-2">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentRequests.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                  >
                    <td className="px-5 py-2.5 text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(r.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {r.llmModel}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-muted-foreground">{r.source}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.outputTokens.toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-medium">
                      {formatCost(r.costUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
