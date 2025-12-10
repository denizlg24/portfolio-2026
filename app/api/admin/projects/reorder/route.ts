import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items array" }, { status: 400 });
    }

    await connectDB();

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { order: item.order } },
      },
    }));

    await Project.bulkWrite(bulkOps);

    return NextResponse.json({ message: "Projects reordered successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error reordering projects:", error);
    return NextResponse.json({ error: "Failed to reorder projects" }, { status: 500 });
  }
}
