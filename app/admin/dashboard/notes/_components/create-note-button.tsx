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
import { DialogClose } from "@radix-ui/react-dialog";
import { FilePlus2, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export const CreateNoteButton = () => {
  const pathname = usePathname();

  const parentId = useMemo(() => pathname.split("/").pop(), [pathname]);

  const [noteName, setNoteName] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleCreateFolder = async () => {
    if (!noteName || parentId === "notes") return;
    try {
      setLoading(true);
      const response = await fetch("/api/admin/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: noteName,
          parentId: parentId,
        }),
      });
      const data = await response.json();
      router.push(`/admin/dashboard/notes/${parentId}/${data._id}`);
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
          <FilePlus2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Create a new note on the current directory
          </DialogDescription>
        </DialogHeader>
        <div className="w-full flex flex-col gap-2 items-start">
          <Label htmlFor="note-name">Note Name</Label>
          <Input
            value={noteName}
            onChange={(e) => setNoteName(e.target.value)}
            placeholder="Note Name"
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
              "Create Note"
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
