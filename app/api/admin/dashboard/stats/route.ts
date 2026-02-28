import { addDays, endOfDay, startOfDay } from "date-fns";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Blog } from "@/models/Blog";
import { BlogComment } from "@/models/BlogComment";
import { CalendarEvent } from "@/models/CalendarEvent";
import { Contact } from "@/models/Contact";
import { EmailModel } from "@/models/Email";
import { LlmUsage } from "@/models/LlmUsage";
import { Note } from "@/models/Notes";
import { Project } from "@/models/Project";
import { Resource } from "@/models/Resource";
import { TimetableEntry } from "@/models/TimetableEntry";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();

    const now = new Date();
    const todayDayOfWeek = now.getDay();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    const startOfTomorrow = startOfDay(addDays(now, 1));
    const endOfWeek = endOfDay(addDays(now, 7));

    const [totalContacts, unreadContacts, recentContacts] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: "new" }),
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt status")
        .lean(),
    ]);

    const [totalProjects, featuredProjects] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ isFeatured: true }),
    ]);

    const [totalBlogs, publishedBlogs] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ isActive: true }),
    ]);

    const [todayEvents, upcomingEvents, calendarEvents] = await Promise.all([
      CalendarEvent.countDocuments({
        date: { $gte: startOfToday, $lte: endOfToday },
        status: { $ne: "canceled" },
      }),
      CalendarEvent.countDocuments({
        date: { $gte: startOfTomorrow, $lte: endOfWeek },
        status: "scheduled",
      }),
      CalendarEvent.find({
        date: { $gte: startOfToday },
        status: { $ne: "canceled" },
      })
        .sort({ date: 1 })
        .limit(5)
        .select("title date status")
        .lean(),
    ]);

    const [totalComments, pendingComments] = await Promise.all([
      BlogComment.countDocuments(),
      BlogComment.countDocuments({ approved: false }),
    ]);

    const todayTimetable = await TimetableEntry.find({
      dayOfWeek: todayDayOfWeek,
      isActive: true,
    })
      .sort({ startTime: 1 })
      .select("title startTime endTime place color")
      .lean();

    const resources = await Resource.find({ isActive: true })
      .select("name type healthCheck.isHealthy healthCheck.lastCheckedAt")
      .lean();

    const [totalEmails, unreadEmails] = await Promise.all([
      EmailModel.countDocuments(),
      EmailModel.countDocuments({ seen: false }),
    ]);

    const totalNotes = await Note.countDocuments();
    const recentNotes = await Note.find()
      .sort({ updatedAt: -1 })
      .limit(3)
      .select("title updatedAt")
      .lean();

    const llmToday = await LlmUsage.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: "$costUsd" },
          totalRequests: { $sum: 1 },
          totalInputTokens: { $sum: "$inputTokens" },
          totalOutputTokens: { $sum: "$outputTokens" },
        },
      },
    ]);

    return NextResponse.json({
      contacts: {
        total: totalContacts,
        unread: unreadContacts,
        recent: recentContacts.map((contact) => ({
          _id: String(contact._id),
          name: contact.name,
          email: contact.email,
          createdAt: contact.createdAt,
          status: contact.status,
        })),
      },
      projects: {
        total: totalProjects,
        featured: featuredProjects,
      },
      blogs: {
        total: totalBlogs,
        published: publishedBlogs,
      },
      calendar: {
        todayEvents,
        upcomingEvents,
        events: calendarEvents.map((event) => ({
          _id: String(event._id),
          title: event.title,
          date: event.date,
          status: event.status,
        })),
      },
      comments: {
        total: totalComments,
        pending: pendingComments,
      },
      timetable: todayTimetable.map((entry) => ({
        _id: String(entry._id),
        title: entry.title,
        startTime: entry.startTime,
        endTime: entry.endTime,
        place: entry.place,
        color: entry.color,
      })),
      resources: resources.map((r) => ({
        _id: String(r._id),
        name: r.name,
        type: r.type,
        isHealthy: r.healthCheck?.isHealthy ?? null,
        lastCheckedAt: r.healthCheck?.lastCheckedAt ?? null,
      })),
      emails: {
        total: totalEmails,
        unread: unreadEmails,
      },
      notes: {
        total: totalNotes,
        recent: recentNotes.map((n) => ({
          _id: String(n._id),
          title: n.title,
          updatedAt: n.updatedAt,
        })),
      },
      llm: {
        todayCost: llmToday[0]?.totalCost ?? 0,
        todayRequests: llmToday[0]?.totalRequests ?? 0,
        todayInputTokens: llmToday[0]?.totalInputTokens ?? 0,
        todayOutputTokens: llmToday[0]?.totalOutputTokens ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
