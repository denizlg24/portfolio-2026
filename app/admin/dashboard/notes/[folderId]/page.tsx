import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { connectDB } from "@/lib/mongodb";
import { Folder, IFolder } from "@/models/Folder";
import {
  Edit3,
  EllipsisVertical,
  FileTextIcon,
  FolderIcon,
  Trash,
} from "lucide-react";
import { CreateFolderButton } from "../_components/create-folder-button";
import mongoose from "mongoose";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";
import { SearchBar } from "../_components/search-bar";
import { CreateNoteButton } from "../_components/create-note-button";
import { SortFilesButton } from "../_components/sort-files-button";
import { notFound } from "next/navigation";
import { INote, Note } from "@/models/Notes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default async function AdminNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ folderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { search, sort = "dateAsc" } = await searchParams;
  const { folderId } = await params;
  const parentFolder = new mongoose.Types.ObjectId(folderId);
  await connectDB();
  const folder = await Folder.findById(folderId)
    .populate<{
      notes: INote[];
    }>("notes")
    .lean();
  if (!folder) {
    notFound();
  }

  const folders = search
    ? await Folder.find(
        { parentFolder: parentFolder, $text: { $search: search as string } },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .lean()
    : await Folder.find({ parentFolder: parentFolder }).lean();

  const notes = search
    ? (
        await Note.find(
          { $text: { $search: search as string } },
          { score: { $meta: "textScore" } },
        )
          .sort({ score: { $meta: "textScore" } })
          .lean()
      ).filter((n) =>
        folder.notes.some((fn) => fn._id.toString() === n._id.toString()),
      )
    : folder.notes;

  const groupedData = [
    ...folders.map((folder) => ({ type: "folder", data: folder })),
    ...notes.map((note) => ({ type: "note", data: note })),
  ];
  const sortedGroupedData = groupedData.sort((a, b) => {
    if (sort === "nameAsc") {
      const aName =
        a.type === "folder"
          ? (a.data as IFolder).name
          : (a.data as INote).title;
      const bName =
        b.type === "folder"
          ? (b.data as IFolder).name
          : (b.data as INote).title;
      return aName.localeCompare(bName);
    } else if (sort === "nameDesc") {
      const aName =
        a.type === "folder"
          ? (a.data as IFolder).name
          : (a.data as INote).title;
      const bName =
        b.type === "folder"
          ? (b.data as IFolder).name
          : (b.data as INote).title;
      return bName.localeCompare(aName);
    } else if (sort === "dateAsc") {
      return a.data.updatedAt.getTime() - b.data.updatedAt.getTime();
    } else if (sort === "dateDesc") {
      return b.data.updatedAt.getTime() - a.data.updatedAt.getTime();
    }
    return 0;
  });
  let currentDir = folder.name;
  let parentFolderId = folder.parentFolder;
  const parents = [{ folderName: currentDir, folderId: folderId }];
  while (parentFolderId) {
    const parentFolder = await Folder.findById(parentFolderId).lean();
    if (parentFolder) {
      currentDir = parentFolder.name;
      parents.unshift({
        folderName: parentFolder.name,
        folderId: parentFolder._id.toString(),
      });
      parentFolderId = parentFolder.parentFolder;
    } else {
      break;
    }
  }
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
        <CreateNoteButton />
        <CreateFolderButton />
      </div>
      <Breadcrumb>
        <BreadcrumbList className="text-xs!">
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/dashboard/notes`}>
              home
            </BreadcrumbLink>
          </BreadcrumbItem>
          {parents.map((parent) => {
            return (
              <React.Fragment key={parent.folderId}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={`/admin/dashboard/notes/${parent.folderId}`}
                  >
                    {parent.folderName}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      {(!folders || folders.length === 0) && (!notes || notes.length === 0) && (
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
      {((folders && folders.length > 0) || (notes && notes.length > 0)) && (
        <div className="w-full flex flex-col gap-0">
          {sortedGroupedData.map((item) => {
            if (item.type === "folder") {
              const folder = item.data as IFolder;
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
            } else if (item.type === "note") {
              const note = item.data as INote;
              return (
                <React.Fragment key={note._id.toString()}>
                  <div className="w-full relative pl-3">
                    <a
                      href={`/admin/dashboard/notes/${folderId}/${note._id.toString()}`}
                      key={note._id.toString()}
                      className="group flex flex-row items-center gap-1"
                    >
                      <FileTextIcon className="text-muted-foreground group-hover:text-foreground transition-colors w-4 h-4 shrink-0" />
                      <p className="text-xs text-left truncate grow">
                        {note.title}
                      </p>
                      <p className="text-xs text-right w-max shrink-0">
                        {format(new Date(note.updatedAt), "Pp").replace(
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
                          Rename Note
                        </Button>
                        <Separator />
                        <Button
                          className="py-1! px-2 rounded-none text-xs h-fit!"
                          variant="ghost"
                        >
                          <Trash />
                          Delete Note
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Separator className="my-1 w-full" />
                </React.Fragment>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
