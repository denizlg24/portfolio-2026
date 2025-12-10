"use client";

import { getAge } from "@/lib/utils";

export default function CurrentYear() {
  return <>{new Date().getFullYear()}</>;
}
