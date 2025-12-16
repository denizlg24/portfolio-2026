import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { BlogComment } from "@/models/BlogComment";

function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("blogId");
    const parentId = searchParams.get("parentId");

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 },
      );
    }

    if (!isValidObjectId(blogId)) {
      return NextResponse.json(
        { error: "Invalid blog ID format" },
        { status: 400 },
      );
    }

    if (parentId && !isValidObjectId(parentId)) {
      return NextResponse.json(
        { error: "Invalid parent comment ID format" },
        { status: 400 },
      );
    }

    await connectDB();

    const query: Record<string, unknown> = {
      blogId,
    };

    if (parentId) {
      query.commentId = parentId;
    } else {
      query.commentId = { $exists: false };
    }

    const comments = await BlogComment.find(query)
      .sort({ createdAt: parentId ? 1 : -1 })
      .lean();

    const formattedComments = comments.map((comment) => ({
      ...comment,
      _id: comment._id.toString(),
    }));

    return NextResponse.json({ comments: formattedComments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogId, commentId, authorName, content } = body;

    if (typeof blogId !== "string" || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    if (typeof authorName !== "string") {
      return NextResponse.json(
        { error: "Invalid author data" },
        { status: 400 },
      );
    }

    const sanitizedContent = sanitizeString(content);
    const sanitizedAuthorName = sanitizeString(authorName);

    if (!blogId || !sanitizedContent) {
      return NextResponse.json(
        { error: "Blog ID and content are required" },
        { status: 400 },
      );
    }

    if (!sanitizedAuthorName) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 },
      );
    }

    if (!isValidObjectId(blogId)) {
      return NextResponse.json(
        { error: "Invalid blog ID format" },
        { status: 400 },
      );
    }

    if (
      commentId &&
      (typeof commentId !== "string" || !isValidObjectId(commentId))
    ) {
      return NextResponse.json(
        { error: "Invalid comment ID format" },
        { status: 400 },
      );
    }

    if (sanitizedAuthorName.length > 100) {
      return NextResponse.json(
        { error: "Author name is too long (max 100 characters)" },
        { status: 400 },
      );
    }

    if (sanitizedContent.length > 5000) {
      return NextResponse.json(
        { error: "Comment is too long (max 5000 characters)" },
        { status: 400 },
      );
    }

    if (sanitizedContent.length < 2) {
      return NextResponse.json(
        { error: "Comment is too short (min 2 characters)" },
        { status: 400 },
      );
    }

    await connectDB();

    const comment = await BlogComment.create({
      blogId,
      commentId: commentId || undefined,
      authorName: sanitizedAuthorName,
      content: sanitizedContent,
    });

    return NextResponse.json(
      {
        message: "Comment submitted successfully.",
        comment: {
          ...comment.toObject(),
          _id: comment._id.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 },
    );
  }
}
