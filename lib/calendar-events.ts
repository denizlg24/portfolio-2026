import { CalendarEvent, ILeanCalendarEvent } from "@/models/CalendarEvent";
import { connectDB } from "./mongodb";
import { endOfDay, startOfDay } from "date-fns";

export const getMonthCalendarEvents = async (start: Date, end: Date) => {
  try {
    await connectDB();
    const events = await CalendarEvent.find({
      date: { $gte: start, $lte: end },
    }).lean();
    return events.map((event) => ({
      ...event,
      _id: (event._id as string).toString(),
      links: event.links.map((link) => ({
        ...link,
        _id: (link._id as string).toString(),
      })),
    }));
  } catch {
    return [];
  }
};

export const getCalendarEvents = async (date: Date) => {
  try {
    await connectDB();
    const events = await CalendarEvent.find({ date: { $gte: startOfDay(date), $lte: endOfDay(date) } }).lean();
    return events.map((event) => ({
      ...event,
      _id: (event._id as string).toString(),
      links: event.links.map((link) => ({
        ...link,
        _id: (link._id as string).toString(),
      })),
    }));
  } catch {
    return [];
  }
};

export const updateCalendarEvent = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<ILeanCalendarEvent>;
}) => {
  try {
    await connectDB();
    
    if (data.notifyBySlack && (data.date || data.notifyBeforeMinutes !== undefined)) {
      const event = await CalendarEvent.findById(id);
      if (event) {
        const eventDate = new Date(data.date || event.date);
        const notifyBeforeMinutes = data.notifyBeforeMinutes ?? event.notifyBeforeMinutes;
        data.notifyAt = new Date(
          eventDate.getTime() - notifyBeforeMinutes * 60_000
        );
      }
    }
    
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    if (!updatedEvent) return null;
    return {
      ...updatedEvent,
      _id: (updatedEvent._id as string).toString(),
      links: updatedEvent.links.map((link) => ({
        ...link,
        _id: (link._id as string).toString(),
      })),
    };
  } catch {
    return null;
  }
};

export const deleteCalendarEvent = async (id: string) => {
  try {
    await connectDB();
    await CalendarEvent.findByIdAndDelete(id);
    return true;
  } catch {
    return false;
  }
};

export const createCalendarEvent = async (
  data: Partial<ILeanCalendarEvent>
) => {
  try {
    await connectDB();
    if (data.notifyBySlack && data.date && data.notifyBeforeMinutes !== undefined) {
      data.notifyAt = new Date(
        new Date(data.date).getTime() - data.notifyBeforeMinutes * 60_000
      );
    }
    
    
    const newEvent = new CalendarEvent(data);
    const savedEvent = await newEvent.save();
    return {
      ...savedEvent.toObject(),
      _id: (savedEvent._id as string).toString(),
      links: savedEvent.links.map((link) => ({
        ...link,
        _id: (link._id as string).toString(),
      })),
    };
  } catch (err) {
    console.log(err);
    return null;
  }
};
