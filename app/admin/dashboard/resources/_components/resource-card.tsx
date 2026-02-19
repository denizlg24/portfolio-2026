"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LeanResource } from "./resources-manager";
import { CreateResourceDialog } from "./create-resource-dialog";
import { AddCapabilityDialog } from "./add-capability-dialog";
import { CapabilitySection } from "./capability-section";

const TYPE_LABELS: Record<string, string> = {
  pi: "Pi",
  vps: "VPS",
  api: "API",
  service: "Service",
};

function HealthDot({ resource }: { resource: LeanResource }) {
  if (!resource.healthCheck.enabled) return null;

  const { isHealthy, lastCheckedAt } = resource.healthCheck;
  let color = "bg-gray-400";
  let title = "Not checked yet";

  if (isHealthy === true) {
    color = "bg-green-500";
    title = "Healthy";
  } else if (isHealthy === false) {
    color = "bg-red-500";
    title = "Unhealthy";
  }

  if (lastCheckedAt) {
    title += ` · checked ${formatDistanceToNow(new Date(lastCheckedAt), { addSuffix: true })}`;
  }

  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} title={title} />
  );
}

interface ResourceCardProps {
  resource: LeanResource;
  onRefresh: () => void;
}

export function ResourceCard({ resource, onRefresh }: ResourceCardProps) {
  const [expanded, setExpanded] = useState(resource.capabilities.length > 0);
  const [editOpen, setEditOpen] = useState(false);
  const [addCapOpen, setAddCapOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/resources/${resource._id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to delete resource");
      }
      toast.success("Resource deleted");
      setDeleteOpen(false);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete resource");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 p-0.5 hover:bg-muted rounded shrink-0"
            >
              {expanded
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <HealthDot resource={resource} />
                <span className="font-medium text-sm">{resource.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {TYPE_LABELS[resource.type] ?? resource.type}
                </Badge>
                {!resource.isActive && (
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                )}
                {resource.capabilities.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {resource.capabilities.length} capabilit{resource.capabilities.length !== 1 ? "ies" : "y"}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground">{resource.url}</p>
              {resource.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{resource.description}</p>
              )}
              {resource.healthCheck.enabled && resource.healthCheck.lastResponseTimeMs !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Response: {resource.healthCheck.lastResponseTimeMs}ms
                  {resource.healthCheck.lastStatus !== null && ` · Status: ${resource.healthCheck.lastStatus}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setAddCapOpen(true)}
              title="Add capability"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditOpen(true)}
              title="Edit resource"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              title="Delete resource"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {expanded && resource.capabilities.length > 0 && (
          <div className="mt-4 ml-7 space-y-3 border-t pt-3">
            {resource.capabilities.map((cap) => (
              <CapabilitySection
                key={cap._id}
                resourceId={resource._id}
                resourceUrl={resource.url}
                capability={cap}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}

        {expanded && resource.capabilities.length === 0 && (
          <div className="mt-4 ml-7 border-t pt-3 text-center py-4">
            <p className="text-xs text-muted-foreground mb-2">No capabilities added yet</p>
            <Button variant="outline" size="sm" onClick={() => setAddCapOpen(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add Capability
            </Button>
          </div>
        )}
      </Card>

      <CreateResourceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onRefresh}
        resource={resource}
      />

      <AddCapabilityDialog
        open={addCapOpen}
        onOpenChange={setAddCapOpen}
        onSuccess={onRefresh}
        resourceId={resource._id}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogTitle>Delete Resource</DialogTitle>
          <DialogDescription>
            Delete &ldquo;{resource.name}&rdquo; and all its capabilities? This cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
