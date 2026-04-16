import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Bookmark } from "@/models/Bookmark";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    await connectDB();
    const tags = await Bookmark.distinct<string>("tags").exec();
    const cleaned = tags
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim())
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ tags: cleaned }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
