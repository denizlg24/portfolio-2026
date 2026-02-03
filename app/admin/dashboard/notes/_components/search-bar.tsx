"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const SearchBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearchChange(input);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [input]);

  const handleSearchChange = (newSearch: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (newSearch) {
      searchParams.set("search", newSearch);
    } else {
      searchParams.delete("search");
    }
    router.push(`${pathname}?${searchParams.toString()}`);
  };

  return (
    <Input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Search for folder or note file"
      className="w-full text-sm"
    />
  );
};
