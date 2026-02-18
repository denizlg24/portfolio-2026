import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { CustomApi } from "@/models/CustomApi";
import { piCronFetch, type PiCronJob, type PiCronJobInput } from "@/lib/picron";

async function getConnection(apiId: string) {
  await connectDB();
  const api = await CustomApi.findById(apiId).lean();
  if (api?.apiType !== "picron") throw new Error("Not a PiCron connection");

  const username = process.env.PICRON_USERNAME;
  const password = process.env.PICRON_PASSWORD;
  if (!username || !password) throw new Error("PICRON_USERNAME / PICRON_PASSWORD env vars not set");

  return { baseUrl: api.baseUrl, username, password };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ apiId: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { apiId } = await params;
    const conn = await getConnection(apiId);
    const jobs = await piCronFetch<PiCronJob[]>(apiId, conn.baseUrl, conn.username, conn.password, "/api/jobs");
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("PiCron GET /jobs:", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ apiId: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { apiId } = await params;
    const body = await request.json() as PiCronJobInput;
    const conn = await getConnection(apiId);
    const job = await piCronFetch<PiCronJob>(
      apiId, conn.baseUrl, conn.username, conn.password,
      "/api/jobs", { method: "POST", body: JSON.stringify(body) }
    );
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("PiCron POST /jobs:", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
