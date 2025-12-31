"use client";

import { Button } from "@/components/ui/button";

import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  isBefore,
  isSameDay,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { CalendarDayDialog } from "./calendar-day-dialog";
import { ILeanCalendarEvent } from "@/models/CalendarEvent";
import { cn } from "@/lib/utils";

export function Calendar({ onEventChange }: { onEventChange?: () => void }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<ILeanCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const days = getDaysInMonth(new Date(year, month));

  useEffect(() => {
    const fetchMonthEvents = async () => {
      setLoading(true);
      try {
        const start = startOfMonth(new Date(year, month));
        const end = endOfMonth(new Date(year, month));
        
        const response = await fetch(
          `/api/admin/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Failed to fetch month events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthEvents();
  }, [month, year]);

  const getEventsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return events.filter((event) =>
      isSameDay(new Date(event.date), date)
    );
  };

  return (
    <div className="w-full flex flex-col gap-2 items-center">
      <div className="mx-auto flex flex-row items-center justify-between gap-2 w-52">
        <Button
          onClick={() => {
            const date = new Date(year, month);
            const prevMonth = subMonths(date, 1);
            setMonth(prevMonth.getMonth());
            setYear(prevMonth.getFullYear());
          }}
          size="icon-sm"
          variant="ghost"
        >
          <ChevronLeft />
        </Button>
        <p className="text-center text-sm font-semibold">
          {format(new Date(year, month), "MMMM yyyy")}
        </p>
        <Button
          onClick={() => {
            const date = new Date(year, month);
            const nextMonth = addMonths(date, 1);
            setMonth(nextMonth.getMonth());
            setYear(nextMonth.getFullYear());
          }}
          size="icon-sm"
          variant="ghost"
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="w-full grid grid-cols-7 gap-0 max-w-4xl mx-auto">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <p
            key={day}
            className="text-center xs:text-sm text-xs font-semibold my-4 xs:scale-95 scale-75"
          >
            {day}
          </p>
        ))}
        {Array.from({ length: getDay(new Date(year, month, 1)) }, (_, i) => (
          <div
            key={i + "empty"}
            className="bg-surface w-full col-span-1 aspect-square h-auto border"
          ></div>
        ))}

        {Array.from({ length: days }).map((_, i) => {
          const dayEvents = getEventsForDay(i + 1);
          const eventCount = dayEvents.length;
          const hasScheduled = dayEvents.some((e) => e.status === "scheduled");
          const hasCompleted = dayEvents.some((e) => e.status === "completed");
          
          return isBefore(new Date(year, month, i + 2), new Date()) ? (
            <div
              key={i}
              className="border bg-surface/30 p-1.5 w-full col-span-1 aspect-square h-auto relative shadow-sm overflow-hidden"
            >
              <span className="absolute xs:top-1 top-0 xs:left-1 left-0.5 text-xs font-semibold text-foreground/50 lg:scale-100 xs:scale-75 scale-65">
                {i + 1}
              </span>
              {eventCount > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-0.5 xs:p-1 space-y-0.5 lg:scale-100 xs:scale-75 scale-65 origin-bottom-left">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                      key={event._id}
                      className="flex items-center gap-1 text-xs leading-tight pl-1"
                    >
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
 event.status === "scheduled" && "bg-muted",
                          event.status === "completed" && "bg-accent-strong",
                          event.status === "canceled" && "bg-red-900"
                        )}
                      />
                      <span className="overflow-hidden whitespace-nowrap text-foreground/50 font-medium">
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {eventCount > 2 && (
                    <div className="text-xs text-foreground/40 font-medium pl-2.5 whitespace-nowrap">
                      <span className="hidden xs:inline">+{eventCount - 2} more</span>
                      <span className="xs:hidden">+{eventCount - 2}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <CalendarDayDialog 
              date={new Date(year, month, i + 1)} 
              key={"date" + i}
              events={dayEvents}
              onEventChange={onEventChange}
            />
          );
        })}
        {Array.from(
          { length: 6 - getDay(new Date(year, month, days)) },
          (_, i) => (
            <div
              key={i + "empty"}
              className="bg-surface w-full col-span-1 aspect-square h-auto border"
            ></div>
          )
        )}
      </div>
    </div>
  );
}
