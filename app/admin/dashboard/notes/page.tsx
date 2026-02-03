import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { connectDB } from "@/lib/mongodb";
import { Folder } from "@/models/Folder";
import { Edit3, EllipsisVertical, FolderIcon, Trash } from "lucide-react";
import { CreateFolderButton } from "./_components/create-folder-button";
import { SearchBar } from "./_components/search-bar";
import { SortFilesButton } from "./_components/sort-files-button";
import React from "react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";

export default async function AdminNotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { search, sort = "dateAsc" } = await searchParams;
  await connectDB();
  const folders = search
    ? await Folder.find(
        { parentFolder: null, $text: { $search: search as string } },
        { score: { $meta: "textScore" } },
      ).sort({ score: { $meta: "textScore" } })
    : await Folder.find({ parentFolder: null }).lean();
  const sortedFolders = folders.sort((a, b) => {
    if (sort === "nameAsc") {
      return a.name.localeCompare(b.name);
    } else if (sort === "nameDesc") {
      return b.name.localeCompare(a.name);
    } else if (sort === "dateAsc") {
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    } else if (sort === "dateDesc") {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
    return 0;
  });
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
        <SortFilesButton />
        <CreateFolderButton />
      </div>
      <Breadcrumb>
        <BreadcrumbList className="text-xs!">
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/dashboard/notes`}>
              home
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {(!sortedFolders || sortedFolders.length === 0) && (
        <Empty className="w-full max-w-5xl mx-auto">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderIcon />
            </EmptyMedia>
            <EmptyTitle>No Notes Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any notes yet. Get started by creating
              your first note.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {sortedFolders && sortedFolders.length > 0 && (
        <div className="w-full flex flex-col gap-0">
          {sortedFolders.map((folder) => {
            return (
              <React.Fragment key={folder._id.toString()}>
                <div className="w-full relative pl-3">
                  <a
                    href={`/admin/dashboard/notes/${folder._id.toString()}`}
                    key={folder._id.toString()}
                    className="group flex flex-row items-center gap-1"
                  >
                    <FolderIcon className="text-muted-foreground group-hover:text-foreground transition-colors w-4 h-4 shrink-0" />
                    <p className="text-xs text-left truncate grow">
                      {folder.name}
                    </p>
                    <p className="text-xs text-right w-max shrink-0">
                      {format(new Date(folder.updatedAt), "Pp").replace(
                        ",",
                        "",
                      )}
                    </p>
                  </a>
                  <Popover>
                    <PopoverTrigger
                      className="absolute -left-0.5 top-px"
                      asChild
                    >
                      <EllipsisVertical className="w-4 h-4" />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-fit flex flex-col gap-1 p-0! rounded-none!"
                    >
                      <Button
                        className="py-1! px-2 rounded-none text-xs h-fit!"
                        variant="ghost"
                      >
                        <Edit3 />
                        Rename Folder
                      </Button>
                      <Separator />
                      <Button
                        className="py-1! px-2 rounded-none text-xs h-fit!"
                        variant="ghost"
                      >
                        <Trash />
                        Delete Folder
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator className="my-1 w-full" />
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
