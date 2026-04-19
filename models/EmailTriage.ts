import mongoose, { type Document, Schema } from "mongoose";

export type TriageCategory =
  | "spam"
  | "newsletter"
  | "promo"
  | "fyi"
  | "action-needed"
  | "scheduled";

export type TriageSuggestionStatus = "pending" | "accepted" | "dismissed";
export type TriagePriority = "none" | "low" | "medium" | "high" | "urgent";

export interface ITriageTaskSuggestion {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  priority: TriagePriority;
  dueDate?: Date;
  status: TriageSuggestionStatus;
  acceptedCardId?: mongoose.Types.ObjectId;
}

export interface ITriageEventSuggestion {
  _id: mongoose.Types.ObjectId;
  title: string;
  date: Date;
  place?: string;
  status: TriageSuggestionStatus;
  acceptedEventId?: mongoose.Types.ObjectId;
}

export interface IEmailTriage extends Document {
  emailId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  stage: "prefilter" | "full";
  category: TriageCategory;
  confidence: number;
  summary?: string;
  suggestedTasks: ITriageTaskSuggestion[];
  suggestedEvents: ITriageEventSuggestion[];
  userStatus: "pending" | "reviewed" | "archived";
  modelUsed: string;
  triagedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanEmailTriage {
  _id: string;
  emailId: string;
  accountId: string;
  stage: "prefilter" | "full";
  category: TriageCategory;
  confidence: number;
  summary?: string;
  suggestedTasks: (Omit<
    ITriageTaskSuggestion,
    "_id" | "acceptedCardId"
  > & {
    _id: string;
    acceptedCardId?: string;
  })[];
  suggestedEvents: (Omit<
    ITriageEventSuggestion,
    "_id" | "acceptedEventId"
  > & {
    _id: string;
    acceptedEventId?: string;
  })[];
  userStatus: "pending" | "reviewed" | "archived";
  modelUsed: string;
  triagedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSuggestionSchema = new Schema<ITriageTaskSuggestion>({
  title: { type: String, required: true },
  description: { type: String },
  priority: {
    type: String,
    enum: ["none", "low", "medium", "high", "urgent"],
    default: "none",
  },
  dueDate: { type: Date },
  status: {
    type: String,
    enum: ["pending", "accepted", "dismissed"],
    default: "pending",
  },
  acceptedCardId: { type: Schema.Types.ObjectId, ref: "KanbanCard" },
});

const EventSuggestionSchema = new Schema<ITriageEventSuggestion>({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  place: { type: String },
  status: {
    type: String,
    enum: ["pending", "accepted", "dismissed"],
    default: "pending",
  },
  acceptedEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvent" },
});

const EmailTriageSchema = new Schema<IEmailTriage>(
  {
    emailId: {
      type: Schema.Types.ObjectId,
      ref: "Email",
      required: true,
      unique: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "EmailAccount",
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: ["prefilter", "full"],
      required: true,
    },
    category: {
      type: String,
      enum: ["spam", "newsletter", "promo", "fyi", "action-needed", "scheduled"],
      required: true,
      index: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    summary: { type: String },
    suggestedTasks: { type: [TaskSuggestionSchema], default: [] },
    suggestedEvents: { type: [EventSuggestionSchema], default: [] },
    userStatus: {
      type: String,
      enum: ["pending", "reviewed", "archived"],
      default: "pending",
      index: true,
    },
    modelUsed: { type: String, required: true },
    triagedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

EmailTriageSchema.index({ userStatus: 1, triagedAt: -1 });

export const EmailTriageModel: mongoose.Model<IEmailTriage> =
  mongoose.models.EmailTriage ||
  mongoose.model<IEmailTriage>("EmailTriage", EmailTriageSchema);
