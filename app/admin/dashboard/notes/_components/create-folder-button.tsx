"use client";

import { DialogClose } from "@radix-ui/react-dialog";
import { FolderPlus, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CreateFolderButton = () => {
  const pathname = usePathname();

  const parentId = useMemo(() => pathname.split("/").pop(), [pathname]);

  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleCreateFolder = async () => {
    if (!folderName) return;
    try {
      setLoading(true);
      const response = await fetch("/api/admin/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          parentId: parentId === "notes" ? null : parentId,
        }),
      });
      const data = await response.json();
      router.push(`/admin/dashboard/notes/${data._id}`);
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-lg">
          <FolderPlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder on the current directory
          </DialogDescription>
        </DialogHeader>
        <div className="w-full flex flex-col gap-2 items-start">
          <Label htmlFor="folder-name">Folder Name</Label>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder Name"
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button
            variant="default"
            onClick={handleCreateFolder}
            disabled={loading}
          >
            {loading ? (
              <>
                Creating... <Loader2 className="animate-spin" />
              </>
            ) : (
              "Create Folder"
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
