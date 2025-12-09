"use client";

import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export const SignOutButton = () => {
  const router = useRouter();
  return (
    <a
    href="#"
      onClick={async (e) => {
        e.preventDefault();
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/auth/login");
            },
          },
        });
      }}
    >
      <LogOut />
      <span>Logout</span>
    </a>
  );
};
