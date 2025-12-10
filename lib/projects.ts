import { Project } from "@/models/Project";
import { connectDB } from "./mongodb";

export async function getProjectTags(){
  await connectDB();
  const tags = await Project.distinct("tags");
  return tags;
}

export async function getFilteredActiveProjects({tags,query}:{tags:string[],query:string}) {
  await connectDB();
  const filter: any = { isActive: true };

  if (tags.length > 0) {
    filter.tags = { $all: tags };
  }

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { subtitle: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ];
  }

  const projects = await Project.find(filter).sort({ order: 1 }).lean().exec();
  return projects.map((project) => ({
    ...project,
    _id: project._id.toString(),
    links:project.links.map((link) => ({
      ...link,
      _id: link._id.toString(),
    }))
  }));
}

export async function getAllProjects() {
  await connectDB();
  const projects = await Project.find().sort({ order: 1 }).lean().exec();
  return projects.map((project) => ({
    ...project,
    _id: project._id.toString(),
    links:project.links.map((link) => ({
      ...link,
      _id: link._id.toString(),
    }))
  }));
}

export async function getActiveProjects() {
  await connectDB();
  const projects = await Project.find({ isActive: true }).sort({ order: 1 }).lean().exec();
  return projects.map((project) => ({
    ...project,
    _id: project._id.toString(),
    links:project.links.map((link) => ({
      ...link,
      _id: link._id.toString(),
    }))
  }));
}

export async function getProjectById(id: string) {
  await connectDB();
  const project = await Project.findById(id).lean().exec();
  if (!project) return null;

  return {
    ...project,
    _id: project._id.toString(),
    links:project.links.map((link) => ({
      ...link,
      _id: link._id.toString(),
    }))
  };
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
    links:project.links.map((link) => ({
      ...link,
      _id: link._id.toString(),
    }))
  };
}
