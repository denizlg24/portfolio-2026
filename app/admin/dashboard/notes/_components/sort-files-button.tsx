"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SortFilesButton = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") as
    | "nameAsc"
    | "nameDesc"
    | "dateAsc"
    | "dateDesc"
    | null;
  const router = useRouter();

  const handleFilterChange = (newSort: typeof sort) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("sort", newSort!);
    router.push(`${pathname}?${searchParams.toString()}`);
  };

  return (
    <Select
      value={sort ?? "dateAsc"}
      onValueChange={(value) => {
        handleFilterChange(value as typeof sort);
      }}
    >
      <SelectTrigger className="w-35">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nameAsc">Name A-Z</SelectItem>
        <SelectItem value="nameDesc">Name Z-A</SelectItem>
        <SelectItem value="dateDesc">Recent First</SelectItem>
        <SelectItem value="dateAsc">Oldest first</SelectItem>
      </SelectContent>
    </Select>
  );
};
