import {
  Whiteboard,
  ILeanWhiteboard,
  ILeanWhiteboardMeta,
  IWhiteboardElement,
} from "@/models/Whiteboard";
import { connectDB } from "./mongodb";

function serializeWhiteboard(whiteboard: any): ILeanWhiteboard {
  return {
    ...whiteboard,
    _id: whiteboard._id.toString(),
  };
}

function serializeWhiteboardMeta(whiteboard: any): ILeanWhiteboardMeta {
  return {
    _id: whiteboard._id.toString(),
    name: whiteboard.name,
    order: whiteboard.order,
    createdAt: whiteboard.createdAt,
    updatedAt: whiteboard.updatedAt,
  };
}

export async function getAllWhiteboards(): Promise<ILeanWhiteboardMeta[]> {
  try {
    await connectDB();
    const whiteboards = await Whiteboard.find({})
      .select("name order createdAt updatedAt")
      .sort({ order: 1 })
      .lean();
    return whiteboards.map(serializeWhiteboardMeta);
  } catch {
    return [];
  }
}

export async function getWhiteboardById(
  id: string
): Promise<ILeanWhiteboard | null> {
  try {
    await connectDB();
    const whiteboard = await Whiteboard.findById(id).lean();
    if (!whiteboard) return null;
    return serializeWhiteboard(whiteboard);
  } catch {
    return null;
  }
}

export async function createWhiteboard(data: {
  name: string;
}): Promise<ILeanWhiteboard | null> {
  try {
    await connectDB();
    const maxOrder = await Whiteboard.findOne({})
      .sort({ order: -1 })
      .select("order")
      .lean();
    const order = maxOrder ? maxOrder.order + 1 : 0;

    const whiteboard = new Whiteboard({
      name: data.name,
      elements: [],
      viewState: { x: 0, y: 0, zoom: 1 },
      order,
    });
    const saved = await whiteboard.save();
    return serializeWhiteboard(saved.toObject());
  } catch {
    return null;
  }
}

export async function updateWhiteboard(
  id: string,
  data: Partial<{
    name: string;
    elements: IWhiteboardElement[];
    viewState: { x: number; y: number; zoom: number };
    order: number;
  }>
): Promise<ILeanWhiteboard | null> {
  try {
    await connectDB();
    const updated = await Whiteboard.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    if (!updated) return null;
    return serializeWhiteboard(updated);
  } catch (err) {
    console.error("Failed to update whiteboard:", err);
    return null;
  }
}

export async function deleteWhiteboard(id: string): Promise<boolean> {
  try {
    await connectDB();
    await Whiteboard.findByIdAndDelete(id);
    return true;
  } catch {
    return false;
  }
}

export async function reorderWhiteboards(
  orderedIds: string[]
): Promise<boolean> {
  try {
    await connectDB();
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index },
      },
    }));
    await Whiteboard.bulkWrite(bulkOps);
    return true;
  } catch {
    return false;
  }
}
