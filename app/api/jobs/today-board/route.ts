import { NextRequest, NextResponse } from "next/server";
import { clearTodayBoard } from "@/lib/whiteboard";

export async function GET(request: NextRequest) {
  const token = process.env.TODAY_BOARD_RESET_JOB_TOKEN;
  if (
    !token ||
    request.headers.get("Authorization") !== `Bearer ${token}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await clearTodayBoard();
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
