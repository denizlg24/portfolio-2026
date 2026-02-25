import {
  Conversation,
  type ILeanConversation,
} from "@/models/Conversation";
import { connectDB } from "./mongodb";

export async function getAllConversations(): Promise<
  Pick<ILeanConversation, "_id" | "title" | "llmModel" | "updatedAt">[]
> {
  await connectDB();

  const conversations = await Conversation.find()
    .select("title llmModel updatedAt")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean<
      Pick<ILeanConversation, "_id" | "title" | "llmModel" | "updatedAt">[]
    >();

  return conversations;
}

export async function getConversation(
  id: string,
): Promise<ILeanConversation | null> {
  await connectDB();

  const conversation =
    await Conversation.findById(id).lean<ILeanConversation | null>();
  return conversation;
}

export async function createConversation(data: {
  title: string;
  llmModel: string;
}): Promise<ILeanConversation> {
  await connectDB();

  const conversation = new Conversation({
    title: data.title,
    llmModel: data.llmModel,
    messages: [],
  });

  await conversation.save();
  return conversation.toObject() as unknown as ILeanConversation;
}

export async function updateConversationMessages(
  id: string,
  messages: ILeanConversation["messages"],
): Promise<ILeanConversation | null> {
  await connectDB();

  const conversation = await Conversation.findByIdAndUpdate(
    id,
    { messages },
    { new: true },
  ).lean<ILeanConversation | null>();

  return conversation;
}

export async function deleteConversation(id: string): Promise<boolean> {
  await connectDB();

  const result = await Conversation.deleteOne({ _id: id });
  return result.deletedCount > 0;
}
