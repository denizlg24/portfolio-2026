import { Project, IProject } from "@/models/Project";
import { connectDB } from "./mongodb";

export async function getAllProjects() {
  await connectDB();
  const projects = await Project.find().sort({ order: 1 }).lean().exec();
  return projects.map((project) => ({
    ...project,
    _id: project._id.toString(),
  })) as (IProject & { _id: string })[];
}

export async function getActiveProjects() {
  await connectDB();
  const projects = await Project.find({ isActive: true }).sort({ order: 1 }).lean().exec();
  return projects.map((project) => ({
    ...project,
    _id: project._id.toString(),
  })) as (IProject & { _id: string })[];
}

export async function getProjectById(id: string) {
  await connectDB();
  const project = await Project.findById(id).lean().exec();
  if (!project) return null;

  return {
    ...project,
    _id: project._id.toString(),
  } as IProject & { _id: string };
}

export async function toggleProjectActive(id: string) {
  await connectDB();
  const project = await Project.findById(id);
  if (!project) return null;

  project.isActive = !project.isActive;
  await project.save();

  return {
    ...project.toObject(),
    _id: project._id.toString(),
  };
}
