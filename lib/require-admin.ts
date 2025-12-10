import { NextRequest } from "next/server";
import { getServerSession } from "./get-server-session";
import { forbidden } from "next/navigation";

export async function requireAdmin(request?: NextRequest) {
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
