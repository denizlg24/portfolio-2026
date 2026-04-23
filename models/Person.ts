import mongoose, { type Document, Schema } from "mongoose";

export interface BirthdayParts {
  month: number;
  day: number;
  year?: number | null;
}

export interface IPerson extends Document {
  name: string;
  birthday?: BirthdayParts | null;
  placeMet?: string;
  notes: string;
  photos: string[];
  groupIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanPerson {
  _id: string;
  name: string;
  birthday?: BirthdayParts | null;
  placeMet?: string;
  notes: string;
  photos: string[];
  groupIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BirthdaySchema = new Schema<BirthdayParts>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
    year: { type: Number, default: null },
  },
  { _id: false },
);

const PersonSchema = new Schema<IPerson>(
  {
    name: { type: String, required: true, trim: true, index: true },
    birthday: { type: BirthdaySchema, default: null },
    placeMet: { type: String },
    notes: { type: String, default: "" },
    photos: [{ type: String }],
    groupIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "PersonGroup",
        index: true,
      },
    ],
  },
  { timestamps: true },
);

export const Person: mongoose.Model<IPerson> =
  (mongoose.models.Person as mongoose.Model<IPerson> | undefined) ||
  mongoose.model<IPerson>("Person", PersonSchema);
