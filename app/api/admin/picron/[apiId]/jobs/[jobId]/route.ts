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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ apiId: string; jobId: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { apiId, jobId } = await params;
    const body = await request.json() as Partial<PiCronJobInput & { enabled: boolean }>;
    const conn = await getConnection(apiId);
    const job = await piCronFetch<PiCronJob>(
      apiId, conn.baseUrl, conn.username, conn.password,
      `/api/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(body) }
    );
    return NextResponse.json(job);
  } catch (error) {
    console.error("PiCron PUT /jobs/[id]:", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ apiId: string; jobId: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { apiId, jobId } = await params;
    const conn = await getConnection(apiId);
    const result = await piCronFetch<{ status: string }>(
      apiId, conn.baseUrl, conn.username, conn.password,
      `/api/jobs/${jobId}`, { method: "DELETE" }
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("PiCron DELETE /jobs/[id]:", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
