import { headers } from "next/headers";
import { auth } from "./auth";
import { NextRequest } from "next/server";

export const getServerSession = async (request?:NextRequest) => {
  return await auth.api.getSession({
    headers: request ? request.headers : await headers(),
  });
};
