import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Resource } from "@/models/Resource";
import { getPiCronCredentials } from "@/lib/capabilities/picron";
import { piCronFetch, type PiCronJob, type PiCronJobInput } from "@/lib/picron";

async function getConnection(resourceId: string, capId: string) {
  await connectDB();
  const resource = await Resource.findById(resourceId);
  if (!resource) throw new Error("Resource not found");

  const cap = resource.capabilities.id(capId);
  if (!cap || cap.type !== "picron") throw new Error("PiCron capability not found");

  const { username, password } = getPiCronCredentials(cap);
  return { baseUrl: resource.url, username, password, cacheKey: capId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; capId: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id, capId } = await params;
    const conn = await getConnection(id, capId);
    const jobs = await piCronFetch<PiCronJob[]>(
      conn.cacheKey, conn.baseUrl, conn.username, conn.password, "/api/jobs",
    );
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("PiCron GET /jobs:", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; capId: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id, capId } = await params;
    const body = (await request.json()) as PiCronJobInput;
    const conn = await getConnection(id, capId);
    const job = await piCronFetch<PiCronJob>(
      conn.cacheKey, conn.baseUrl, conn.username, conn.password,
      "/api/jobs", { method: "POST", body: JSON.stringify(body) },
    );
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("PiCron POST /jobs:", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
