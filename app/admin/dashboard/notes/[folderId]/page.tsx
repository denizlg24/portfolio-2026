import { Separator } from "@/components/ui/separator";
import { CreateFolderButton } from "../_components/create-folder-button";
import { CreateNoteButton } from "../_components/create-note-button";
import { FileExplorer } from "../_components/file-explorer";
import { SearchBar } from "../_components/search-bar";
import { SortFilesButton } from "../_components/sort-files-button";

export default async function AdminFolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;

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
      <FileExplorer folderId={folderId} />
    </div>
  );
}
