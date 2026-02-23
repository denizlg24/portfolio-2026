import { NextRequest, NextResponse } from "next/server";
import { clearTodayBoard } from "@/lib/whiteboard";
import { connectDB } from "@/lib/mongodb";
import { Whiteboard } from "@/models/Whiteboard";

export async function GET(request: NextRequest) {
  const token = process.env.TODAY_BOARD_RESET_JOB_TOKEN;
  if (!token || request.headers.get("Authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    connectDB();
    const alreadyCleared = await Whiteboard.findOneAndUpdate(
      { name: "Today", hasBeenCleared: true },
      { hasBeenCleared: false },
    );
    if (alreadyCleared) {
      return NextResponse.json({ result: "Already cleared today" });
    }
    const result = await clearTodayBoard();
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
