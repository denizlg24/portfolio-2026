import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { runAllHealthChecks } from "@/lib/health-check";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const results = await runAllHealthChecks(true);
  return NextResponse.json({ results });
}
