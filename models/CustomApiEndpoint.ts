import mongoose, { Document, Schema } from 'mongoose';

export type BodyFieldType = "string" | "number" | "boolean" | "object" | "string[]" | "number[]" | "boolean[]" | "null";

export interface ICustomApiEndpoint extends Document {
    apiId: mongoose.Types.ObjectId;
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers: Map<string, string>;
    body: Map<string, BodyFieldType>;
    name: string;
    description: string;
    isActive: boolean;
}

export interface ILeanCustomApiEndpoint {
    _id: string;
    apiId: string;
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers: Record<string, string>;
    body: Record<string, BodyFieldType>;
    name: string;
    description: string;
    isActive: boolean;
}

const CustomApiEndpointSchema: Schema = new Schema({
    apiId: { type: mongoose.Types.ObjectId, ref: 'CustomApi', required: true },
    path: { type: String, required: true },
    method: { type: String, enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], required: true },
    headers: { type: Map, of: String, default: {} },
    body: { type: Map, of: Schema.Types.Mixed, default: {} },
    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, required: true }
});

export const CustomApiEndpoint: mongoose.Model<ICustomApiEndpoint> = mongoose.models.CustomApiEndpoint || mongoose.model<ICustomApiEndpoint>('CustomApiEndpoint', CustomApiEndpointSchema);
