"use client";

import { ILeanProject } from "@/models/Project";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";

interface ProjectListProps {
  projects: ILeanProject[];
  onRefresh: () => void;
  onReorder: (projects: ILeanProject[]) => void;
}

export function ProjectList({
  projects,
  onRefresh,
  onReorder,
}: ProjectListProps) {
  const handleToggleActive = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle project visibility");
      }

      onRefresh();
    } catch (error) {
      console.error("Error toggling project visibility:", error);
      alert("Failed to toggle project visibility. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      onRefresh();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects found</p>
      </div>
    );
  }

  return (
    <Sortable
      value={projects}
      onValueChange={onReorder}
      getItemValue={(project) => project._id}
    >
      <SortableContent>
        <div className="space-y-3">
          {projects.map((project) => (
            <SortableItem key={project._id} value={project._id} asChild>
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <SortableItemHandle className="sm:block hidden cursor-grab active:cursor-grabbing shrink-0">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </SortableItemHandle>
                  <div className="flex sm:flex-row flex-col items-center gap-3 sm:gap-2 w-full sm:w-auto">
                    {project.images && project.images.length > 0 && (
                      <div className="relative w-full h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden shrink-0">
                        <Image
                          src={project.images[0]}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="font-semibold text-base sm:text-lg truncate">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {project.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 5).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.tags.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center justify-end sm:justify-start gap-2 w-full sm:w-auto shrink-0">
                    <SortableItemHandle className="sm:hidden block cursor-grab active:cursor-grabbing shrink-0 mr-auto">
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </SortableItemHandle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(project._id)}
                      title={project.isActive ? "Hide project" : "Show project"}
                    >
                      {project.isActive ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        href={`/admin/dashboard/projects/${project._id}/edit`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(project._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </SortableItem>
          ))}
        </div>
      </SortableContent>
    </Sortable>
  );
}
