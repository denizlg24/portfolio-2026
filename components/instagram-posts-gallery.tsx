"use client";

import CircularGallery, {
  CircularGalleryProps,
} from "@/components/CircularGallery";
import { cn } from "@/lib/utils";

export const InstagramPostsGallery = ({
  className,
  items,
}: {
  className?: string;
  items?: CircularGalleryProps["items"];
}) => {
  return (
    <div className={cn("relative w-full sm:h-[300px] xs:h-[250px] h-[150px] text-foreground", className)}>
      <CircularGallery
        items={items}
        bend={2}
        textColor="#778873"
        font="bold 48px Inter"
        borderRadius={0.05}
        scrollEase={0.15}
        autoScrollSpeed={0.03}
      />
    </div>
  );
};
