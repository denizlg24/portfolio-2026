import mongoose, { type Document, Schema } from "mongoose";

export interface IBookmarkGroup extends Document {
  name: string;
  description?: string;
  color?: string;
  autoCreated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanBookmarkGroup {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  autoCreated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkGroupSchema = new Schema<IBookmarkGroup>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String },
    color: { type: String },
    autoCreated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const BookmarkGroup: mongoose.Model<IBookmarkGroup> =
  mongoose.models.BookmarkGroup ||
  mongoose.model<IBookmarkGroup>("BookmarkGroup", BookmarkGroupSchema);
