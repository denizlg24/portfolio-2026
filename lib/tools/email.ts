import type { ToolDefinition } from "./types";
import { connectDB } from "@/lib/mongodb";
import { EmailModel } from "@/models/Email";

export const emailTools: ToolDefinition[] = [
  {
    schema: {
      name: "list_emails",
      description:
        "List recent emails. Returns subject, sender, date, and read status.",
      input_schema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max number of emails to return (default 20)",
          },
          unreadOnly: {
            type: "boolean",
            description: "Only show unread emails (default false)",
          },
        },
      },
    },
    isWrite: false,
    category: "email",
    execute: async (input) => {
      await connectDB();
      const limit = (input.limit as number) || 20;
      const filter: Record<string, unknown> = {};
      if (input.unreadOnly) filter.seen = false;
      const emails = await EmailModel.find(filter)
        .sort({ date: -1 })
        .limit(limit)
        .lean();
      return emails.map((e) => ({
        _id: e._id.toString(),
        subject: e.subject,
        from: e.from,
        date: e.date,
        seen: e.seen,
      }));
    },
  },
  {
    schema: {
      name: "get_email",
      description: "Get details of a specific email by its ID.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Email ID" },
        },
        required: ["id"],
      },
    },
    isWrite: false,
    category: "email",
    execute: async (input) => {
      await connectDB();
      const email = await EmailModel.findById(input.id as string).lean();
      if (!email) throw new Error("Email not found");
      return {
        _id: email._id.toString(),
        subject: email.subject,
        from: email.from,
        date: email.date,
        seen: email.seen,
      };
    },
  },
];
