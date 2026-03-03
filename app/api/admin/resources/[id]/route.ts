import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { encryptPassword } from "@/lib/safe-email-password";
import { Resource } from "@/models/Resource";

function serializeResource(r: any) {
  return {
    _id: r._id.toString(),
    name: r.name,
    description: r.description,
    url: r.url,
    type: r.type,
    isActive: r.isActive,
    agentService: r.agentService,
    capabilities: (r.capabilities ?? []).map((c: any) => ({
      _id: c._id.toString(),
      type: c.type,
      label: c.label,
      baseUrl: c.baseUrl,
      config: c.config,
      isActive: c.isActive,
    })),
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  await connectDB();
  const resource = await Resource.findById(id).lean();
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(serializeResource(resource));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  let newSecret = null;
  if (body.agentService && typeof body.agentService.hmacSecret === "string" && body.agentService.hmacSecret.trim()) {
    newSecret = encryptPassword(body.agentService.hmacSecret);
  }

  await connectDB();
  const existingResource = await Resource.findById(id);
  if (!existingResource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
    if(!newSecret){
    newSecret = existingResource?.agentService?.hmacSecret;
  }
  const resource = await Resource.findByIdAndUpdate(id, {...body, "agentService.hmacSecret":newSecret}, {
    new: true,
  }).lean();
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(serializeResource(resource));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  await connectDB();
  const resource = await Resource.findByIdAndDelete(id);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "deleted" });
}
