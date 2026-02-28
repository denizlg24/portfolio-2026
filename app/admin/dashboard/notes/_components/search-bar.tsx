"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export const SearchBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("search") || "");

  const handleSearchChange = useCallback((newSearch: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    if (newSearch) {
      searchParams.set("search", newSearch);
    } else {
      searchParams.delete("search");
    }
    router.push(`${pathname}?${searchParams.toString()}`);
  }, [pathname, router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearchChange(input);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [input, handleSearchChange]);



  return (
    <Input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Search for folder or note file"
      className="w-full text-sm"
    />
  );
};
