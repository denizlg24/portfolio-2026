import { Separator } from "@/components/ui/separator";
import { EllipsisVertical, FolderIcon } from "lucide-react";
import { CreateFolderButton } from "../_components/create-folder-button";
import { SearchBar } from "../_components/search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import React from "react";

export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Notes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Group notes into folders to keep things organized.
        </p>
      </div>
      <Separator className="my-1 w-full" />
      <div className="flex flex-row items-center justify-between gap-2">
        <SearchBar />
        <CreateFolderButton />
      </div>
      <Separator className="my-1 w-full" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/dashboard/notes`}>
              home
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator className="my-1 w-full" />
      <div className="w-full grid md:grid-cols-8 sm:grid-cols-6 grid-cols-4 pt-6">
        {Array.from({ length: 16 }).map((_, index) => {
          return (
            <React.Fragment key={index}>
              <div className="w-full relative pl-3">
                <div className="group flex flex-row items-center gap-1">
                  <FolderIcon className="text-muted-foreground group-hover:text-foreground transition-colors w-4 h-4 shrink-0" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <div className="absolute -left-0.5 top-px">
                  <EllipsisVertical className="w-4 h-4" />
                </div>
              </div>
              <Separator className="my-1 w-full" />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
