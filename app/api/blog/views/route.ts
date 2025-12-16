import { type NextRequest, NextResponse } from "next/server";
import {
  getAllBlogViews,
  getBlogViewCount,
  incrementBlogViewCount,
} from "@/lib/blog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("blogId");

    if (!blogId) {
      const viewsMap = await getAllBlogViews();
      return NextResponse.json({ views: viewsMap }, { status: 200 });
    }

    const views = await getBlogViewCount(blogId);

    return NextResponse.json({ views }, { status: 200 });
  } catch (error) {
    console.error("Error fetching blog views:", error);
    return NextResponse.json(
      { error: "Failed to fetch views" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { blogId } = await request.json();

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 },
      );
    }

    const views = await incrementBlogViewCount(blogId);

    return NextResponse.json({ views }, { status: 200 });
  } catch (error) {
    console.error("Error incrementing blog views:", error);
    return NextResponse.json(
      { error: "Failed to increment views" },
      { status: 500 },
    );
  }
}
