import {
  createCalendarEvent,
  getMonthCalendarEvents,
  getCalendarEvents,
} from "@/lib/calendar-events";
import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const body = await request.json();
  const created = await createCalendarEvent(body);
  if (!created) {
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
  return NextResponse.json({ event: created }, { status: 200 });
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  
  if (dateParam) {
    const date = new Date(dateParam);
    const events = await getCalendarEvents(date);
    return NextResponse.json({ events }, { status: 200 });
  }

  
  if (startParam && endParam) {
    const start = new Date(startParam);
    const end = new Date(endParam);
    const events = await getMonthCalendarEvents(start, end);
    return NextResponse.json({ events }, { status: 200 });
  }

  return NextResponse.json(
    { error: "Either 'date' or both 'start' and 'end' parameters are required" },
    { status: 400 }
  );
}
