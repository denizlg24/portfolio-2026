import mongoose, { Schema, Document } from "mongoose";

export interface ProjectT {
  title: string;
  subtitle: string;
  images: string[];
  links: {
    label: string;
    url: string;
    icon: "external" | "github" | "notepad";
  }[];
  markdown: string;
  tags: string[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IProject = ProjectT & Document;

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    links: [
      {
        label: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        icon: {
          type: String,
          enum: ["external", "github", "notepad"],
          default: "external",
        },
      },
    ],
    markdown: {
      type: String,
      required: true,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ order: 1 });
ProjectSchema.index({ isActive: 1 });
ProjectSchema.index({ tags: 1 });

export const Project =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
