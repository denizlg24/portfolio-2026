"use client";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Notebook, RefreshCcwIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export const BlogSection = ({ initialBlogs }: { initialBlogs: string[] }) => {
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState(initialBlogs);
  const query = searchParams.get("query") || "";
  const arrayTags = searchParams.getAll("tags") || [];
  const sort = searchParams.get("sort") || "newest";
  const router = useRouter();
  return (
    <>
      <div className="col-span-full w-full flex flex-row items-center justify-end">
        <div className="w-fit shrink-0 flex flex-row items-center justify-end gap-2">
          <Label>Sort by:</Label>
          <Select
            value={sort}
            onValueChange={(value) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("sort", value);
              const queryString = newParams.toString();
              router.push(`/blog?${queryString}`);
            }}
          >
            <SelectTrigger className="w-fit">
              {sort == "most-popular"
                ? "Most popular"
                : sort == "newest"
                ? "Newest"
                : "Oldest"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-popular">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Empty className="col-span-full">
        <EmptyHeader className="max-w-lg!">
          <EmptyMedia variant="icon">
            <Notebook />
          </EmptyMedia>
          <EmptyTitle>No posts to display</EmptyTitle>
          <EmptyDescription>
            {query || arrayTags.length > 0
              ? "Whoops. There are no posts matching your filters. Maybe I have to start posting more, or maybe you should adjust your filters..."
              : "Whoops. There are no posts to display. Either I broke something or I'm lazy and still haven't written anything. You decide..."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" size="sm">
            <Link href={"/blog"}>
              {query || arrayTags.length > 0 ? (
                <>
                  <Trash2 /> Clear filters
                </>
              ) : (
                <>
                  <RefreshCcwIcon />
                  Refresh
                </>
              )}
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </>
  );
};
