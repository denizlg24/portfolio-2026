"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ILeanTimetableEntry } from "@/lib/timetable-constants";
import { TimetableForm, type TimetableFormValues } from "./timetable-form";
import { TimetableGrid } from "./timetable-grid";

interface TimetableManagerProps {
  initialEntries: ILeanTimetableEntry[];
}

export function TimetableManager({ initialEntries }: TimetableManagerProps) {
  const [entries, setEntries] = useState<ILeanTimetableEntry[]>(initialEntries);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ILeanTimetableEntry | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ILeanTimetableEntry | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/admin/timetable");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error("Error fetching timetable entries:", error);
    }
  };

  const handleCreate = async (values: TimetableFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Failed to create entry");
      await fetchEntries();
      setFormOpen(false);
    } catch (error) {
      console.error("Error creating entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (values: TimetableFormValues) => {
    if (!editingEntry) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/timetable/${editingEntry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Failed to update entry");
      await fetchEntries();
      setEditingEntry(null);
    } catch (error) {
      console.error("Error updating entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/timetable/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete entry");
      await fetchEntries();
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntryClick = (entry: ILeanTimetableEntry) => {
    setEditingEntry(entry);
  };

  return (
    <>
      <div className="flex sm:flex-row flex-col sm:items-center items-start gap-2 justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Timetable</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your weekly recurring schedule.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      <TimetableGrid entries={entries} onEntryClick={handleEntryClick} />

      
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Timetable Entry</DialogTitle>
            <DialogDescription>
              Create a new recurring weekly entry.
            </DialogDescription>
          </DialogHeader>
          <TimetableForm
            onSubmit={handleCreate}
            isLoading={isLoading}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      
      <Dialog
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>
              Update this entry or delete it.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <TimetableForm
              key={editingEntry._id}
              initialData={{
                title: editingEntry.title,
                dayOfWeek: editingEntry.dayOfWeek,
                startTime: editingEntry.startTime,
                endTime: editingEntry.endTime,
                place: editingEntry.place,
                links: editingEntry.links?.map((l) => ({
                  label: l.label,
                  url: l.url,
                  icon: l.icon,
                })),
                color: editingEntry.color,
                isActive: editingEntry.isActive,
              }}
              onSubmit={handleUpdate}
              isLoading={isLoading}
              mode="edit"
            />
          )}
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => {
                setDeleteTarget(editingEntry);
                setEditingEntry(null);
              }}
            >
              Delete Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
