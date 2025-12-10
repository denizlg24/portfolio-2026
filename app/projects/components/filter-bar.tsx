"use client";
import { useSearchParams } from "next/navigation";
import { TagSelect } from "./tag-select";
import { SearchInput } from "./search-input";

export const FilterBar = ({ tags }: { tags: string[] }) => {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const arrayTags = searchParams.getAll("tags") || [];
  return (
    <div className="w-full flex flex-col items-center justify-between gap-2 xs:flex-row mt-16">
      <SearchInput query={query} />
      <TagSelect selected={arrayTags} tags={tags} />
    </div>
  );
};
