import { Separator } from "@/components/ui/separator";
import { connectDB } from "@/lib/mongodb";
import { Folder } from "@/models/Folder";
import mongoose from "mongoose";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";
import { Note } from "@/models/Notes";
import { notFound } from "next/navigation";
import { ContentEditor } from "./_components/content-editor";

export default async function AdminNotesPage({
  params,
}: {
  params: Promise<{ folderId: string; noteId: string }>;
}) {
  const { folderId, noteId } = await params;
  await connectDB();
  const folder = await Folder.findById(folderId).lean();
  const note = await Note.findById(noteId).lean();
  if (!folder || !note) {
    notFound();
  }
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
      <Breadcrumb>
        <BreadcrumbList>
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
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/admin/dashboard/notes/${folderId}/${noteId}`}
            >
              {note.title}.md
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator className="my-1 w-full" />
      <ContentEditor
        note={{ ...note, _id: note._id.toString() }}
        folderId={folder._id.toString()}
      />
    </div>
  );
}
