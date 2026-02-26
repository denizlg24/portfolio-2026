import type { ToolDefinition } from "./types";
import { getAllBlogs, getBlogById, getFilteredActiveBlogs } from "@/lib/blog";

export const blogTools: ToolDefinition[] = [
  {
    schema: {
      name: "list_blogs",
      description: "List all blog posts with their titles, tags, and metadata.",
      input_schema: {
        type: "object",
        properties: {},
      },
    },
    isWrite: false,
    category: "blog",
    execute: async () => {
      const blogs = await getAllBlogs();
      return blogs.map((b) => ({
        _id: b._id,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        tags: b.tags,
        isActive: b.isActive,
        timeToRead: b.timeToRead,
      }));
    },
  },
  {
    schema: {
      name: "get_blog",
      description: "Get the full content of a blog post by its ID.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Blog post ID" },
        },
        required: ["id"],
      },
    },
    isWrite: false,
    category: "blog",
    execute: async (input) => {
      const blog = await getBlogById(input.id as string);
      if (!blog) throw new Error("Blog post not found");
      return blog;
    },
  },
  {
    schema: {
      name: "search_blogs",
      description: "Search blog posts by query text and/or tags.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (optional)" },
          tags: {
            type: "array",
            description: "Filter by tags (optional)",
            items: { type: "string" },
          },
        },
      },
    },
    isWrite: false,
    category: "blog",
    execute: async (input) => {
      const blogs = await getFilteredActiveBlogs({
        query: (input.query as string) ?? "",
        tags: (input.tags as string[]) ?? [],
      });
      return blogs.map((b) => ({
        _id: b._id,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        tags: b.tags,
        timeToRead: b.timeToRead,
      }));
    },
  },
];
