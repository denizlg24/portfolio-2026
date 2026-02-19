"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { IHealthCheck, ILeanCapability } from "@/models/Resource";
import { CreateResourceDialog } from "./create-resource-dialog";
import { ResourceCard } from "./resource-card";

export interface LeanResource {
  _id: string;
  name: string;
  description: string;
  url: string;
  type: "pi" | "vps" | "api" | "service";
  isActive: boolean;
  healthCheck: IHealthCheck;
  capabilities: ILeanCapability[];
  createdAt: string;
  updatedAt: string;
}

interface ResourcesManagerProps {
  initialResources: LeanResource[];
}

export function ResourcesManager({ initialResources }: ResourcesManagerProps) {
  const [resources, setResources] = useState<LeanResource[]>(initialResources);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/resources", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setResources(data.resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  }, []);

  return (
    <div className="space-y-8 pb-8">
      {resources.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No resources configured</p>
          <p className="text-sm mb-4">
            Add a Raspberry Pi, VPS, or service to get started.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>
      )}

      {resources.length > 0 && (
        <div className="space-y-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onRefresh={fetchResources}
            />
          ))}
        </div>
      )}

      {resources.length > 0 && (
        <div className="flex justify-start pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Resource
          </Button>
        </div>
      )}

      <CreateResourceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchResources}
      />
    </div>
  );
}
