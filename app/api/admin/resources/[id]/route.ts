import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Resource } from "@/models/Resource";

function serializeResource(r: any) {
  return {
    _id: r._id.toString(),
    name: r.name,
    description: r.description,
    url: r.url,
    type: r.type,
    isActive: r.isActive,
    healthCheck: r.healthCheck,
    capabilities: (r.capabilities ?? []).map((c: any) => ({
      _id: c._id.toString(),
      type: c.type,
      label: c.label,
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

  await connectDB();
  const resource = await Resource.findByIdAndUpdate(id, body, {
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
