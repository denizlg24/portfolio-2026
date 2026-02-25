import mongoose from "mongoose";

export interface IConversation extends mongoose.Document {
  title: string;
  llmModel: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    };
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanConversation {
  _id: string;
  title: string;
  llmModel: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    };
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new mongoose.Schema<IConversation>(
  {
    title: { type: String, required: true },
    llmModel: { type: String, required: true },
    messages: {
      type: [
        {
          role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
          },
          content: { type: String, required: true },
          tokenUsage: {
            inputTokens: Number,
            outputTokens: Number,
            costUsd: Number,
          },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

ConversationSchema.index({ updatedAt: -1 });

export const Conversation: mongoose.Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
