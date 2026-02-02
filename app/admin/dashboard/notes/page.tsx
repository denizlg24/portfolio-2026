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
import { FolderIcon } from "lucide-react";
import { CreateFolderButton } from "./_components/create-folder-button";

export default async function AdminNotesPage() {
  await connectDB();
  const folders = await Folder.find({ parentFolder: null }).lean();

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Notes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Group notes into folders to keep things organized.
        </p>
      </div>
      <Separator className="my-2 w-full" />
      <CreateFolderButton />
      {(!folders || folders.length === 0) && (
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
    </div>
  );
}
