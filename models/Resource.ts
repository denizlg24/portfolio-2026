import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface ICapability {
  _id: mongoose.Types.ObjectId;
  type: string;
  label: string;
  config: Record<string, unknown>;
  isActive: boolean;
}

export interface ILeanCapability {
  _id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
  isActive: boolean;
}

export interface IHealthCheck {
  enabled: boolean;
  intervalMinutes: number;
  expectedStatus: number;
  responseTimeThresholdMs: number;
  lastCheckedAt: Date | null;
  lastStatus: number | null;
  lastResponseTimeMs: number | null;
  isHealthy: boolean | null;
}

export interface IResource extends Document {
  name: string;
  description: string;
  url: string;
  type: "pi" | "vps" | "api" | "service";
  isActive: boolean;
  healthCheck: IHealthCheck;
  capabilities: Types.DocumentArray<ICapability>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanResource {
  _id: string;
  name: string;
  description: string;
  url: string;
  type: "pi" | "vps" | "api" | "service";
  isActive: boolean;
  healthCheck: IHealthCheck;
  capabilities: ILeanCapability[];
  createdAt: string;
  updatedAt: string;
}

const CapabilitySchema = new Schema({
  type: { type: String, required: true },
  label: { type: String, required: true },
  config: { type: Schema.Types.Mixed, required: true },
  isActive: { type: Boolean, default: true },
});

const HealthCheckSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    intervalMinutes: { type: Number, default: 5 },
    expectedStatus: { type: Number, default: 200 },
    responseTimeThresholdMs: { type: Number, default: 1000 },
    lastCheckedAt: { type: Date, default: null },
    lastStatus: { type: Number, default: null },
    lastResponseTimeMs: { type: Number, default: null },
    isHealthy: { type: Boolean, default: null },
  },
  { _id: false },
);

const ResourceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["pi", "vps", "api", "service"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    healthCheck: { type: HealthCheckSchema, default: () => ({}) },
    capabilities: [CapabilitySchema],
  },
  { timestamps: true },
);

export const Resource: mongoose.Model<IResource> =
  mongoose.models.Resource ||
  mongoose.model<IResource>("Resource", ResourceSchema);
