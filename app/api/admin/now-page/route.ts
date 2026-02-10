import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { getNowPageContent, upsertNowPageContent } from "@/lib/now-page";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const doc = await getNowPageContent();

    return NextResponse.json(
      { item: doc || { content: "", updatedAt: null } },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching now page content:", error);
    return NextResponse.json(
      { error: "Failed to fetch now page content", details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    if (typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Content is required and must be a string" },
        { status: 400 },
      );
    }

    const item = await upsertNowPageContent(body.content);

    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/now", "layout");
    revalidatePath("/now", "page");

    return NextResponse.json({ item }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating now page content:", error);
    return NextResponse.json(
      { error: "Failed to update now page content", details: error.message },
      { status: 500 },
    );
  }
}
