import mongoose, { type Document, Schema } from "mongoose";

export interface IBookmark extends Document {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
  tags: string[];
  groupIds: mongoose.Types.ObjectId[];
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanBookmark {
  _id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
  tags: string[];
  groupIds: string[];
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    url: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    favicon: { type: String },
    image: { type: String },
    siteName: { type: String },
    tags: [{ type: String, trim: true }],
    groupIds: [{ type: Schema.Types.ObjectId, ref: "BookmarkGroup", index: true }],
    userNotes: { type: String },
  },
  { timestamps: true },
);

BookmarkSchema.index({ createdAt: -1 });

export const Bookmark: mongoose.Model<IBookmark> =
  mongoose.models.Bookmark ||
  mongoose.model<IBookmark>("Bookmark", BookmarkSchema);
