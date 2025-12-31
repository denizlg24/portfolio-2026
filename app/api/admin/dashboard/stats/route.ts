import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/mongodb";
import { Contact } from "@/models/Contact";
import { Project } from "@/models/Project";
import { Blog } from "@/models/Blog";
import { CalendarEvent } from "@/models/CalendarEvent";
import { BlogComment } from "@/models/BlogComment";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();

    const now = new Date();
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
      Blog.countDocuments({ published: true }),
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
        date: { $gte: now },
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
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
