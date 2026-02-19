import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Resource } from "@/models/Resource";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  await connectDB();
  const resources = await Resource.find().sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    resources: resources.map((r) => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description,
      url: r.url,
      type: r.type,
      isActive: r.isActive,
      healthCheck: r.healthCheck,
      capabilities: r.capabilities.map((c) => ({
        _id: c._id.toString(),
        type: c.type,
        label: c.label,
        config: c.config,
        isActive: c.isActive,
      })),
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
      updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const body = await request.json();
  const { name, url, type, description, isActive, healthCheck } = body;

  if (!name || !url || !type) {
    return NextResponse.json(
      { error: "name, url, and type are required" },
      { status: 400 },
    );
  }

  await connectDB();
  const resource = await Resource.create({
    name,
    url,
    type,
    description: description ?? "",
    isActive: isActive ?? true,
    healthCheck: healthCheck ?? {},
    capabilities: [],
  });

  return NextResponse.json(
    {
      ...resource.toObject(),
      _id: resource._id.toString(),
    },
    { status: 201 },
  );
}
