import mongoose, { Schema } from "mongoose";
import type { TriageCategory } from "./EmailTriage";

export interface ICategoryRouting {
  kanbanBoardId?: string;
  kanbanColumnId?: string;
  autoCreateCard: boolean;
  autoAcceptThreshold: number;
}

export interface ITriageSettings {
  _id: string;
  enabled: boolean;
  runIntervalMinutes: number;
  prefilterModel: string;
  fullModel: string;
  categoryRouting: Record<TriageCategory, ICategoryRouting>;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanTriageSettings {
  _id: string;
  enabled: boolean;
  runIntervalMinutes: number;
  prefilterModel: string;
  fullModel: string;
  categoryRouting: Record<TriageCategory, ICategoryRouting>;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TriageSettingsSchema = new Schema<ITriageSettings>(
  {
    _id: { type: String, default: "singleton" },
    enabled: { type: Boolean, default: true },
    runIntervalMinutes: { type: Number, default: 120 },
    prefilterModel: { type: String, default: "claude-haiku-4-5-20251001" },
    fullModel: { type: String, default: "claude-sonnet-4-6" },
    categoryRouting: {
      type: Schema.Types.Mixed,
      default: () => ({
        spam: { autoCreateCard: false, autoAcceptThreshold: 1 },
        newsletter: { autoCreateCard: false, autoAcceptThreshold: 1 },
        promo: { autoCreateCard: false, autoAcceptThreshold: 1 },
        purchases: { autoCreateCard: false, autoAcceptThreshold: 1 },
        fyi: { autoCreateCard: false, autoAcceptThreshold: 1 },
        "action-needed": { autoCreateCard: false, autoAcceptThreshold: 0.85 },
        scheduled: { autoCreateCard: false, autoAcceptThreshold: 0.8 },
      }),
    },
    lastRunAt: { type: Date },
  },
  { timestamps: true, _id: false },
);

// validate routing shape
TriageSettingsSchema.path("categoryRouting").validate((value: unknown) => {
  if (!value || typeof value !== "object") return false;
  return true;
}, "categoryRouting must be an object");

export const TriageSettingsModel: mongoose.Model<ITriageSettings> =
  mongoose.models.TriageSettings ||
  mongoose.model<ITriageSettings>("TriageSettings", TriageSettingsSchema);

export async function getOrCreateTriageSettings(): Promise<
  mongoose.HydratedDocument<ITriageSettings>
> {
  const existing = await TriageSettingsModel.findById("singleton");
  if (existing) return existing;
  return TriageSettingsModel.create({ _id: "singleton" });
}
