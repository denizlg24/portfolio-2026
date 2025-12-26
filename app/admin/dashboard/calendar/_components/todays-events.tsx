"use client";

import { useEffect, useState } from "react";
import { ILeanCalendarEvent } from "@/models/CalendarEvent";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TodaysEvents() {
  const [events, setEvents] = useState<ILeanCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodaysEvents = async () => {
    try {
      const today = new Date();
      const response = await fetch(
        `/api/admin/calendar?date=${today.toISOString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch today's events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysEvents();
    
    
    const interval = setInterval(fetchTodaysEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No events scheduled for today
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event._id}
          className="border rounded-lg p-3 space-y-2 hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <h3 className="font-semibold text-sm wrap-break-word">
                {event.title}
              </h3>
              <Badge
                variant={
                  event.status === "completed"
                    ? "default"
                    : event.status === "canceled"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs shrink-0"
              >
                {event.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 shrink-0" />
            <span>
              {new Date(event.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {event.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.links.map((link) => (
                <a
                  key={link._id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border rounded hover:bg-accent transition-colors"
                >
                  {link.icon ? (
                    <img
                      src={link.icon}
                      alt=""
                      className="w-3 h-3 shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}
                  <ExternalLink
                    className={cn("w-3 h-3 shrink-0", link.icon && "hidden")}
                  />
                  <span className="truncate">{link.label}</span>
                </a>
              ))}
            </div>
          )}

          {event.notifyBySlack && (
            <Badge variant="outline" className="text-xs">
              📢 Slack
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
