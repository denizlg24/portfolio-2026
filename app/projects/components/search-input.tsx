"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const SearchInput = ({ query,related }: { query: string,related:"projects"|"blog" }) => {
  const [input, setInput] = useState(query);
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (input) {
        newParams.set("query", input);
      } else {
        newParams.delete("query");
      }
      router.push(`/${related}?${newParams.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
  }, [input]);

  return (
    <Input
      placeholder={`Search ${related == 'projects' ? "projects" : "for posts"}...`}
      className="w-full grow max-w-sm"
      value={input}
      onChange={(e) => setInput(e.target.value)}
    />
  );
};
