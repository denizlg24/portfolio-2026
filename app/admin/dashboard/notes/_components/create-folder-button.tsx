"use client";

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
import { FolderPlus } from "lucide-react";

export const CreateFolderButton = () => {
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
          <Input placeholder="Folder Name" className="w-full" />
        </div>
        <DialogFooter>
          <Button variant="default">Create Folder</Button>
          <Button variant="ghost">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
