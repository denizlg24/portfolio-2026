"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, useState } from "react";
import { TodaysDate } from "./_components/todays-date";
import { Calendar } from "./_components/calendar";
import { AddEventDialog } from "./_components/add-event-dialog";
import { TodaysEvents } from "./_components/todays-events";

export default function CalendarPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEventChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Calendar Events</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View and manage calendar events</p>
        </div>
       
      </div>

      <Calendar key={refreshKey} onEventChange={handleEventChange} />
       <AddEventDialog onEventCreated={handleEventChange} />
      <div className="p-3 rounded-lg border shadow-xs w-full space-y-4">
        <h2 className="text-base sm:text-lg font-medium w-full border-b pb-2">
          Events Today - <span></span>
          <Suspense
            fallback={
              <Skeleton className="ml-1 w-24 h-5 rounded-full inline-flex" />
            }
          >
            <span className="text-muted-foreground text-xs sm:text-sm font-normal">
              <TodaysDate formatter="dd/MM/yyyy" />
            </span>
          </Suspense>
        </h2>
        <div className="w-full flex flex-col gap-2 overflow-y-auto max-h-[400px]">
          <TodaysEvents key={refreshKey} />
        </div>
      </div>
    </div>
  );
}
