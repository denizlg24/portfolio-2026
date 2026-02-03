import { Separator } from "@/components/ui/separator";
import { FolderIcon } from "lucide-react";
import { CreateFolderButton } from "../_components/create-folder-button";
import { SearchBar } from "../_components/search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";

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
            <div
              key={index}
              className="group col-span-1 w-full flex flex-col gap-2"
            >
              <FolderIcon className="text-muted-foreground group-hover:text-foreground transition-colors w-5 h-5 mx-auto" />
              <Skeleton className="h-4 w-16 rounded mx-auto" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
