import { forbidden } from "next/navigation";
import type { NextRequest } from "next/server";
import { getServerSession } from "./get-server-session";

export async function requireAdmin(_request?: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    forbidden();
  }

  if (!session.user) {
    forbidden();
  }

  if (!session.user.emailVerified) {
    forbidden();
  }

  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    forbidden();
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
