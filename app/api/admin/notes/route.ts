import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Folder } from "@/models/Folder";
import { type INote, Note } from "@/models/Notes";

export const POST = async (request: NextRequest) => {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const { name, parentId } = body;
    await connectDB();
    const foundFolder = await Folder.findById(parentId).populate<{
      notes: INote[];
    }>("notes");
    if (!foundFolder) {
      return NextResponse.json(
        { error: "Folder doesn't exist" },
        { status: 400 },
      );
    }
    const foundNote = foundFolder.notes.find((note) => note.title === name);
    if (foundNote) {
      return NextResponse.json(
        { error: "Note with the same name already exists in this folder." },
        { status: 400 },
      );
    }
    const newNote = await Note.create({
      title: name,
      content: "New note",
    });
    await Folder.findByIdAndUpdate(foundFolder._id, {
      $push: { notes: newNote._id },
    });
    return NextResponse.json({ _id: newNote._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
};

export const GET = async (request: NextRequest) => {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    await connectDB();
    const notes = await Note.find();
    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
};
