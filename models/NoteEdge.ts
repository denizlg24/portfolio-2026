import mongoose, { type Document, Schema } from "mongoose";

export interface INoteEdge extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  strength: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanNoteEdge {
  _id: string;
  from: string;
  to: string;
  strength: number;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NOTE_EDGE_MODEL_NAME = "KnowledgeNoteEdge";
const NOTE_EDGE_COLLECTION_NAME = "knowledge_note_edges";

const NoteEdgeSchema = new Schema<INoteEdge>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeNote",
      required: true,
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeNote",
      required: true,
      index: true,
    },
    strength: { type: Number, default: 1, min: 0, max: 1 },
    reason: { type: String },
  },
  { timestamps: true },
);

NoteEdgeSchema.index({ from: 1, to: 1 }, { unique: true });

export const NoteEdge: mongoose.Model<INoteEdge> =
  (mongoose.models[NOTE_EDGE_MODEL_NAME] as
    | mongoose.Model<INoteEdge>
    | undefined) ||
  mongoose.model<INoteEdge>(
    NOTE_EDGE_MODEL_NAME,
    NoteEdgeSchema,
    NOTE_EDGE_COLLECTION_NAME,
  );
