import { type NextRequest, NextResponse } from "next/server";
import { runAllHealthChecks } from "@/lib/health-check";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const results = await runAllHealthChecks(true);
  return NextResponse.json({ results });
}
