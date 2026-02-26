import mongoose from "mongoose";

export interface IConversationMessage {
  role: "user" | "assistant";
  content: string | unknown[];
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  createdAt: Date;
}

export interface IConversation extends mongoose.Document {
  title: string;
  llmModel: string;
  messages: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanConversation {
  _id: string;
  title: string;
  llmModel: string;
  messages: IConversationMessage[];
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
          content: { type: mongoose.Schema.Types.Mixed, required: true },
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

export const Conversation: mongoose.Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
