"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Trash2, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWhiteboard } from "./whiteboard-provider";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

export function WhiteboardPagesNav() {
  const {
    whiteboards,
    currentWhiteboard,
    loading,
    loadWhiteboard,
    createWhiteboard,
    deleteWhiteboard,
    renameWhiteboard,
  } = useWhiteboard();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setShowLeftScroll(container.scrollLeft > 0);
    setShowRightScroll(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [whiteboards]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await createWhiteboard(newName.trim());
    if (created) {
      loadWhiteboard(created._id);
    }
    setNewName("");
    setIsCreateOpen(false);
  };

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return;
    await renameWhiteboard(renameId, renameName.trim());
    setRenameId(null);
    setRenameName("");
    setIsRenameOpen(false);
  };

  const openRenameDialog = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setRenameId(id);
    setRenameName(name);
    setIsRenameOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteWhiteboard(id);
  };

  return (
    <div className="flex items-center gap-1 min-w-0 flex-1">
      {showLeftScroll && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="size-4" />
        </Button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none pl-2"
        onScroll={checkScroll}
      >
        {loading && whiteboards.length === 0 ? (
          <span className="text-xs text-muted-foreground px-2">Loading...</span>
        ) : (
          whiteboards.map((wb) => (
            <div
              key={wb._id}
              className={cn(
                "group flex items-center gap-1 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors cursor-pointer shrink-0",
                currentWhiteboard?._id === wb._id
                  ? "bg-secondary text-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => loadWhiteboard(wb._id)}
            >
              <span className="max-w-32 truncate">{wb.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded p-0.5 -mr-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={(e) => openRenameDialog(e, wb._id, wb.name)}
                  >
                    <Pencil className="size-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => handleDelete(e, wb._id)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {showRightScroll && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="size-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={() => setIsCreateOpen(true)}
      >
        <Plus className="size-4" />
      </Button>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Page name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Page</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Page name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
