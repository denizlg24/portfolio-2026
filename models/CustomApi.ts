import mongoose, { Document, Schema } from 'mongoose';
import { ICustomApiEndpoint } from './CustomApiEndpoint';

export interface ICustomApi extends Document {
    baseUrl: string;
    name: string;
    description: string;
    endpoints: mongoose.Types.ObjectId[];
    isActive: boolean;
    apiType: string;
}

export interface ILeanCustomApi {
    _id: string;
    baseUrl: string;
    name: string;
    endpoints: string[] | ICustomApiEndpoint[];
    description: string;
    isActive: boolean;
    apiType: string;
}

const CustomApiSchema: Schema = new Schema({
    baseUrl: { type: String, required: true },
    endpoints: [{ type: mongoose.Types.ObjectId, ref: 'CustomApiEndpoint' }],
    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    apiType: { type: String, default: 'generic' },
});

export const CustomApi: mongoose.Model<ICustomApi> = mongoose.models.CustomApi || mongoose.model<ICustomApi>('CustomApi', CustomApiSchema);
