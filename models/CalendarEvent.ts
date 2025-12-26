import mongoose from "mongoose";

export interface ICalendarEvent {
  _id: unknown;
  date: Date;
  title: string;
  links: {
    _id: unknown;
    label: string;
    icon?: string;
    url: string;
  }[];
  status: "scheduled" | "completed" | "canceled";
  notifyBySlack: boolean;
  isNotificationSent: boolean;
  notifyBeforeMinutes: number;
  notifyAt?: Date;
}

export interface ILeanCalendarEvent {
  _id: string;
  date: Date;
  title: string;
  links: {
    _id: string;
    label: string;
    icon?: string;
    url: string;
  }[];
  status: "scheduled" | "completed" | "canceled";
  notifyBySlack: boolean;
  isNotificationSent: boolean;
  notifyBeforeMinutes: number;
  notifyAt?: Date;
}

const LinkSchema = new mongoose.Schema({
  label: { type: String, required: true },
  icon: { type: String },
  url: { type: String, required: true },
});

const CalendarEventSchema = new mongoose.Schema<ICalendarEvent>({
  date: { type: Date, required: true },
  title: { type: String, required: true },
  links: [LinkSchema],
  status: {
    type: String,
    enum: ["scheduled", "completed", "canceled"],
    default: "scheduled",
    index: true,
  },
  notifyBySlack: { type: Boolean, default: false },
  isNotificationSent: { type: Boolean, default: false, index: true },
  notifyBeforeMinutes: { type: Number, default: 15 },
  notifyAt: {
    type: Date,
    index: true,
  },
});

export const CalendarEvent: mongoose.Model<ICalendarEvent> =
  mongoose.models.CalendarEvent ||
  mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);
