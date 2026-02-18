import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { CustomApi } from "@/models/CustomApi";
import { piCronFetch, type PiCronHistoryEntry } from "@/lib/picron";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiId: string; jobId: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { apiId, jobId } = await params;
    await connectDB();
    const api = await CustomApi.findById(apiId).lean();
    if (api?.apiType !== "picron") return NextResponse.json({ error: "Not a PiCron connection" }, { status: 400 });

    const username = process.env.PICRON_USERNAME;
    const password = process.env.PICRON_PASSWORD;
    if (!username || !password) return NextResponse.json({ error: "PICRON_USERNAME / PICRON_PASSWORD env vars not set" }, { status: 500 });

    const history = await piCronFetch<PiCronHistoryEntry[]>(
      apiId, api.baseUrl, username, password,
      `/api/jobs/${jobId}/history`
    );
    return NextResponse.json(history);
  } catch (error) {
    console.error("PiCron GET /history:", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
