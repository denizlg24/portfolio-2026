import { Resource } from "@/models/Resource";
import { connectDB } from "../mongodb";
import type { ToolDefinition } from "./types";

export const resourceTools: ToolDefinition[] = [
  {
    schema: {
      name: "get_resources",
      description:
        "Get all resources. Returns a list of resources with their details.",
      input_schema: {
        type: "object",
        properties: {},
      },
    },
    isWrite: false,
    category: "resources",
    execute: async () => {
      await connectDB();
      const resources = await Resource.find().lean();
      return resources.map((r) => ({
        id: r._id.toString(),
        name: r.name,
        type: r.type,
        url: r.url,
        description: r.description,
        isActive: r.isActive,
      }));
    },
  },
  {
    schema: {
      name: "get_resource_by_id",
      description: "Get a resource by its ID. Returns the resource details.",
      input_schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the resource to retrieve.",
          },
        },
        required: ["id"],
      },
    },
    isWrite: false,
    category: "resources",
    execute: async (input) => {
      const { id } = input;
      await connectDB();
      const resource = await Resource.findById(id).lean();
      if (!resource) {
        return { success: false, message: "Resource not found" };
      }
      return {
        id: resource._id.toString(),
        name: resource.name,
        type: resource.type,
        url: resource.url,
        description: resource.description,
        isActive: resource.isActive,
      };
    },
  },
  {
    schema: {
      name: "get_resource_health",
      description:
        "Get the health status of a resource by its ID. Returns health check details.",
      input_schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the resource to check health for.",
          },
        },
        required: ["id"],
      },
    },
    isWrite: false,
    category: "resources",
    execute: async (input) => {
      const { id } = input;
      await connectDB();
      const resource = await Resource.findById(id).lean();
      if (!resource) {
        return { success: false, message: "Resource not found" };
      }
      const health = resource.healthCheck;
      const status = health.isHealthy
        ? health.lastResponseTimeMs
          ? health.lastResponseTimeMs > 1000
            ? "degraded"
            : "healthy"
          : "unknown"
        : "down";
      return {
        id: resource._id.toString(),
        name: resource.name,
        health: {
          ...health,
        },
        status,
      };
    },
  },
  {
    schema: {
      name: "get_healthy_resources",
      description:
        "Get all healthy resources. Returns a list of healthy resources with their details.",
      input_schema: {
        type: "object",
        properties: {},
      },
    },
    isWrite: false,
    category: "resources",
    execute: async () => {
      await connectDB();
      const resources = await Resource.find({
        "healthCheck.isHealthy": true,
      }).lean();
      return resources.map((r) => ({
        id: r._id.toString(),
        name: r.name,
        health: {
          ...r.healthCheck,
        },
      }));
    },
  },
  {
    schema: {
      name: "create_resource",
      description: "Create a new resource with the given details.",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the resource" },
          url: { type: "string", description: "URL of the resource" },
          type: {
            type: "string",
            description:
              'Type of the resource ("pi" | "vps" | "api" | "service")',
          },
          description: {
            type: "string",
            description: "Description of the resource (optional)",
          },
          isActive: {
            type: "boolean",
            description: "Whether the resource is active (optional)",
          },
          healthEnabled: {
            type: "boolean",
            description: "Enable health checks for this resource",
          },
          intervalMinutes: {
            type: "number",
            description:
              "Health check interval in minutes (optional, default: 5)",
          },
          expectedStatus: {
            type: "number",
            description:
              "Expected HTTP status code for health checks (optional, default: 200)",
          },
          responseTimeThresholdMs: {
            type: "number",
            description:
              "Response time threshold in milliseconds for health checks (optional, default: 1000)",
          },
        },
        required: ["name", "url", "type", "healthEnabled"],
      },
    },
    isWrite: true,
    category: "resources",
    execute: async (input) => {
      const {
        name,
        url,
        type,
        description,
        isActive,
        healthEnabled,
        intervalMinutes,
        expectedStatus,
        responseTimeThresholdMs,
      } = input;
      await connectDB();
      const newResource = new Resource({
        name,
        url,
        type,
        description,
        isActive,
        healthCheck: {
          enabled: healthEnabled,
          intervalMinutes: intervalMinutes ?? 5,
          expectedStatus: expectedStatus ?? 200,
          responseTimeThresholdMs: responseTimeThresholdMs ?? 1000,
        },
      });
      await newResource.save();
      return {
        id: newResource._id.toString(),
        name: newResource.name,
        url: newResource.url,
        type: newResource.type,
        description: newResource.description,
        isActive: newResource.isActive,
      };
    },
  },
  {
    schema: {
      name: "delete_resource",
      description: "Delete a resource by its ID.",
      input_schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID of the resource to delete",
          },
        },
        required: ["id"],
      },
    },
    isWrite: true,
    category: "resources",
    execute: async (input) => {
      const { id } = input;
      await connectDB();
      const deletedResource = await Resource.findByIdAndDelete(id);
      if (!deletedResource) {
        throw new Error("Resource not found");
      }
      return {
        id: deletedResource._id.toString(),
        name: deletedResource.name,
      };
    },
  },
  {
    schema: {
      name: "update_resource",
      description: "Update a resource by its ID with the given details.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID of the resource to update" },
          name: {
            type: "string",
            description: "Name of the resource (optional)",
          },
          url: {
            type: "string",
            description: "URL of the resource (optional)",
          },
          type: {
            type: "string",
            description: "Type of the resource (optional)",
          },
          description: {
            type: "string",
            description: "Description of the resource (optional)",
          },
          isActive: {
            type: "boolean",
            description: "Whether the resource is active (optional)",
          },
          healthEnabled: {
            type: "boolean",
            description:
              "Whether health checks are enabled for the resource (optional)",
          },
          intervalMinutes: {
            type: "number",
            description:
              "Health check interval in minutes (optional, default: 5)",
          },
          expectedStatus: {
            type: "number",
            description:
              "Expected HTTP status code for health checks (optional, default: 200)",
          },
          responseTimeThresholdMs: {
            type: "number",
            description:
              "Response time threshold in milliseconds for health checks (optional, default: 1000)",
          },
        },
        required: ["id"],
      },
    },
    isWrite: true,
    category: "resources",
    execute: async (input) => {
      const {
        id,
        name,
        url,
        type,
        description,
        isActive,
        healthEnabled,
        intervalMinutes,
        expectedStatus,
        responseTimeThresholdMs,
      } = input;
      await connectDB();
      const updatedResource = await Resource.findByIdAndUpdate(
        id,
        {
          name,
          url,
          type,
          description,
          isActive,
          healthCheck: {
            enabled: healthEnabled,
            intervalMinutes,
            expectedStatus,
            responseTimeThresholdMs,
          },
        },
        { new: true },
      );
      if (!updatedResource) {
        throw new Error("Resource not found");
      }
      return {
        id: updatedResource._id.toString(),
        name: updatedResource.name,
        url: updatedResource.url,
        type: updatedResource.type,
      };
    },
  },
];
