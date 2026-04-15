import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { fetchUrlMetadata } from "@/lib/fetch-url-metadata";
import { categorizeBookmark } from "@/lib/bookmark-categorize";
import { Bookmark, type ILeanBookmark } from "@/models/Bookmark";
import {
  BookmarkGroup,
  type ILeanBookmarkGroup,
} from "@/models/BookmarkGroup";
import { BookmarkEdge, type ILeanBookmarkEdge } from "@/models/BookmarkEdge";

function serializeBookmark(b: ILeanBookmark) {
  return {
    ...b,
    _id: String(b._id),
    groupIds: (b.groupIds || []).map(String),
  };
}

function serializeGroup(g: ILeanBookmarkGroup) {
  return { ...g, _id: String(g._id) };
}

function serializeEdge(e: ILeanBookmarkEdge) {
  return {
    ...e,
    _id: String(e._id),
    from: String(e.from),
    to: String(e.to),
  };
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();
    const [bookmarks, groups, edges] = await Promise.all([
      Bookmark.find().sort({ createdAt: -1 }).lean<ILeanBookmark[]>().exec(),
      BookmarkGroup.find()
        .sort({ name: 1 })
        .lean<ILeanBookmarkGroup[]>()
        .exec(),
      BookmarkEdge.find().lean<ILeanBookmarkEdge[]>().exec(),
    ]);
    return NextResponse.json(
      {
        bookmarks: bookmarks.map(serializeBookmark),
        groups: groups.map(serializeGroup),
        edges: edges.map(serializeEdge),
        stats: {
          total: bookmarks.length,
          groups: groups.length,
          edges: edges.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const url: string | undefined = body.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    await connectDB();

    const existing = await Bookmark.findOne({ url })
      .lean<ILeanBookmark>()
      .exec();
    if (existing) {
      return NextResponse.json(
        { error: "Bookmark already exists", bookmark: serializeBookmark(existing) },
        { status: 409 },
      );
    }

    const meta = await fetchUrlMetadata(url);

    const categorization = await categorizeBookmark({
      url: meta.url,
      title: meta.title,
      description: meta.description,
      siteName: meta.siteName,
    });

    const createdGroupIds: string[] = [];
    for (const g of categorization.newGroups) {
      if (!g.name) continue;
      const existingGroup = await BookmarkGroup.findOne({ name: g.name }).exec();
      if (existingGroup) {
        createdGroupIds.push(String(existingGroup._id));
        continue;
      }
      const newGroup = await BookmarkGroup.create({
        name: g.name,
        description: g.description,
        autoCreated: true,
      });
      createdGroupIds.push(String(newGroup._id));
    }

    const validJoinIds = categorization.joinGroupIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    const groupIds = [...new Set([...validJoinIds, ...createdGroupIds])].map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const bookmark = await Bookmark.create({
      url: meta.url,
      title: meta.title,
      description: meta.description,
      favicon: meta.favicon,
      image: meta.image,
      siteName: meta.siteName,
      tags: categorization.tags,
      groupIds,
    });

    const validRelatedIds = categorization.relatedBookmarkIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validRelatedIds.length > 0) {
      const ops = validRelatedIds.map((to) => ({
        updateOne: {
          filter: { from: bookmark._id, to: new mongoose.Types.ObjectId(to) },
          update: { $setOnInsert: { strength: 1 } },
          upsert: true,
        },
      }));
      await BookmarkEdge.bulkWrite(ops);
    }

    const [groups, edges] = await Promise.all([
      BookmarkGroup.find().sort({ name: 1 }).lean<ILeanBookmarkGroup[]>().exec(),
      BookmarkEdge.find({
        $or: [{ from: bookmark._id }, { to: bookmark._id }],
      })
        .lean<ILeanBookmarkEdge[]>()
        .exec(),
    ]);

    const bookmarkObj = bookmark.toObject();
    return NextResponse.json(
      {
        bookmark: {
          ...bookmarkObj,
          _id: bookmark._id.toString(),
          groupIds: groupIds.map(String),
        },
        groups: groups.map(serializeGroup),
        edges: edges.map(serializeEdge),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create bookmark" },
      { status: 500 },
    );
  }
}
