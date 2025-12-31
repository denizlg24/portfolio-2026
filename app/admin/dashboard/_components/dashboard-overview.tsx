"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MessageSquare,
  FolderGit2,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Bell,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface DashboardStats {
  contacts: {
    total: number;
    unread: number;
    recent: Array<{
      _id: string;
      name: string;
      email: string;
      createdAt: Date;
      status: string;
    }>;
  };
  projects: {
    total: number;
    featured: number;
  };
  blogs: {
    total: number;
    published: number;
  };
  calendar: {
    todayEvents: number;
    upcomingEvents: number;
    events: Array<{
      _id: string;
      title: string;
      date: Date;
      status: string;
    }>;
  };
  comments: {
    total: number;
    pending: number;
  };
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 w-full lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 w-full">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      
      <div className="grid gap-4 md:grid-cols-2 w-full lg:grid-cols-4">
        <Link href="/admin/dashboard/contacts">
          <Card className="p-6 hover:bg-accent/5 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Contacts
              </p>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{stats.contacts.total}</h3>
              {stats.contacts.unread > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.contacts.unread} new
                </Badge>
              )}
            </div>
          </Card>
        </Link>

        <Link href="/admin/dashboard/calendar">
          <Card className="p-6 hover:bg-accent/5 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Today's Events
              </p>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{stats.calendar.todayEvents}</h3>
              {stats.calendar.upcomingEvents > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{stats.calendar.upcomingEvents} upcoming
                </Badge>
              )}
            </div>
          </Card>
        </Link>

        <Link href="/admin/dashboard/projects">
          <Card className="p-6 hover:bg-accent/5 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Projects
              </p>
              <FolderGit2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{stats.projects.total}</h3>
              <Badge variant="outline" className="text-xs">
                {stats.projects.featured} featured
              </Badge>
            </div>
          </Card>
        </Link>

        <Link href="/admin/dashboard/comments">
          <Card className="p-6 hover:bg-accent/5 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Comments
              </p>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{stats.comments.total}</h3>
              {stats.comments.pending > 0 && (
                <Badge variant="outline" className="text-xs">
                  {stats.comments.pending} pending
                </Badge>
              )}
            </div>
          </Card>
        </Link>
      </div>

      
      <div className="grid gap-4 md:grid-cols-2 w-full">
        
        <Card className="p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Contacts</h3>
            <Link href="/admin/dashboard/contacts">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {stats.contacts.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent contacts
              </p>
            ) : (
              stats.contacts.recent.slice(0, 3).map((contact) => (
                <Link
                  key={contact._id}
                  href={`/admin/dashboard/contacts/${contact._id}`}
                  className="block"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm line-clamp-1">
                          {contact.name}
                        </p>
                        {contact.status === "new" && (
                          <Badge variant="destructive" className="text-xs shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {contact.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(contact.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        
        <Card className="p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
            <Link href="/admin/dashboard/calendar">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {stats.calendar.events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming events
              </p>
            ) : (
              stats.calendar.events.slice(0, 3).map((event) => (
                <div
                  key={event._id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                >
                  <div className="mt-1 shrink-0">
                    {event.status === "scheduled" ? (
                      <Clock className="w-4 h-4 text-muted" />
                    ) : event.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-strong" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.status === "completed"
                        ? "default"
                        : event.status === "canceled"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs shrink-0"
                  >
                    {event.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Link href="/admin/dashboard/projects/new">
            <Button variant="outline" className="w-full">
              <FolderGit2 className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
          <Link href="/admin/dashboard/blogs/new">
            <Button variant="outline" className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              New Blog Post
            </Button>
          </Link>
          <Link href="/admin/dashboard/timeline/new">
            <Button variant="outline" className="w-full">
              <Clock className="w-4 h-4 mr-2" />
              Add Timeline
            </Button>
          </Link>
          <Link href="/admin/dashboard/calendar">
            <Button variant="outline" className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Schedule Event
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
