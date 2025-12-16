import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import TimelineItem from "@/models/TimelineItem";

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items array" },
        { status: 400 },
      );
    }

    await connectDB();

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { order: item.order } },
      },
    }));

    await TimelineItem.bulkWrite(bulkOps);
    revalidatePath("/");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error reordering timeline items:", error);
    return NextResponse.json(
      { error: "Failed to reorder timeline items", details: error.message },
      { status: 500 },
    );
  }
}
