import mongoose, { type Document, Schema } from "mongoose";

export interface IBlogComment extends Document {
  blogId: string;
  commentId?: string;
  authorName: string;
  content: string;
  isApproved: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanBlogComment {
  _id: string;
  blogId: string;
  commentId?: string;
  authorName: string;
  content: string;
  isApproved: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogCommentSchema = new Schema<IBlogComment>(
  {
    blogId: {
      type: String,
      required: true,
      trim: true,
    },
    commentId: {
      type: String,
      trim: true,
      ref: "BlogComment",
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    isApproved: {
      type: Boolean,
      required: true,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const BlogComment: mongoose.Model<IBlogComment> =
  mongoose.models.BlogComment ||
  mongoose.model<IBlogComment>("BlogComment", BlogCommentSchema);
