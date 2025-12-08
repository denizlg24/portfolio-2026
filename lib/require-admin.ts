import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "./get-server-session";

export async function requireAdmin(request?: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - No session found" },
      { status: 401 }
    );
  }

  if (!session.user) {
    return NextResponse.json(
      { error: "Unauthorized - No user found" },
      { status: 401 }
    );
  }

  if (!session.user.emailVerified) {
    return NextResponse.json(
      { error: "Forbidden - Email not verified" },
      { status: 403 }
    );
  }

  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  return null;
}

export async function getAdminSession() {
  const session = await getServerSession();

  if (!session?.user) {
    return null;
  }

  if (!session.user.emailVerified) {
    return null;
  }

  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    return null;
  }

  return session;
}
