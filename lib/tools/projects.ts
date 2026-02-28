import { getAllProjects, getProjectById } from "@/lib/projects";
import type { ToolDefinition } from "./types";

export const projectsTools: ToolDefinition[] = [
  {
    schema: {
      name: "list_projects",
      description:
        "List all portfolio projects with their titles, tags, and metadata.",
      input_schema: {
        type: "object",
        properties: {},
      },
    },
    isWrite: false,
    category: "projects",
    execute: async () => {
      const projects = await getAllProjects();
      return projects.map((p) => ({
        _id: p._id,
        title: p.title,
        subtitle: p.subtitle,
        tags: p.tags,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        links: p.links,
      }));
    },
  },
  {
    schema: {
      name: "get_project",
      description:
        "Get full details of a project by its ID, including markdown content.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Project ID" },
        },
        required: ["id"],
      },
    },
    isWrite: false,
    category: "projects",
    execute: async (input) => {
      const project = await getProjectById(input.id as string);
      if (!project) throw new Error("Project not found");
      return project;
    },
  },
];
