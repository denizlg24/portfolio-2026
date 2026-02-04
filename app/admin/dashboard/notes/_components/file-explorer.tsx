"use client";

import { format } from "date-fns";
import {
  Edit3,
  EllipsisVertical,
  FileTextIcon,
  FolderIcon,
  Trash,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface FileItem {
  type: "folder" | "note";
  _id: string;
  name: string;
  updatedAt: string;
}

interface BreadcrumbData {
  folderId: string;
  folderName: string;
}

interface FileExplorerProps {
  folderId?: string;
}

export function FileExplorer({ folderId }: FileExplorerProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "dateAsc";

  const [items, setItems] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (folderId) params.set("folderId", folderId);
        if (search) params.set("search", search);
        if (sort) params.set("sort", sort);

        const response = await fetch(`/api/admin/files?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
          setBreadcrumbs(data.breadcrumbs ?? []);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [folderId, search, sort]);

  if (isLoading) {
    return (
      <>
        {folderId && (
          <Breadcrumb>
            <BreadcrumbList className="text-xs!">
              <BreadcrumbItemUI>
                <BreadcrumbLink href={`/admin/dashboard/notes`}>
                  home
                </BreadcrumbLink>
              </BreadcrumbItemUI>
              <BreadcrumbSeparator />
              <BreadcrumbItemUI>
                <Skeleton className="h-3 w-16 rounded" />
              </BreadcrumbItemUI>
            </BreadcrumbList>
          </Breadcrumb>
        )}
        {!folderId && (
          <Breadcrumb>
            <BreadcrumbList className="text-xs!">
              <BreadcrumbItemUI>
                <BreadcrumbLink href={`/admin/dashboard/notes`}>
                  home
                </BreadcrumbLink>
              </BreadcrumbItemUI>
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className="w-full flex flex-col gap-0">
          {Array.from({ length: 8 }).map((_, index) => (
            <React.Fragment key={index}>
              <div className="w-full relative pl-3">
                <div className="group flex flex-row items-center gap-1">
                  <FolderIcon className="text-muted-foreground group-hover:text-foreground transition-colors w-4 h-4 shrink-0" />
                  <Skeleton className="h-3 w-24 rounded" />
                  <div className="grow" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <div className="absolute -left-0.5 top-px">
                  <EllipsisVertical className="w-4 h-4" />
                </div>
              </div>
              <Separator className="my-1 w-full" />
            </React.Fragment>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList className="text-xs!">
          <BreadcrumbItemUI>
            <BreadcrumbLink href={`/admin/dashboard/notes`}>
              home
            </BreadcrumbLink>
          </BreadcrumbItemUI>
          {breadcrumbs.map((parent) => (
            <React.Fragment key={parent.folderId}>
              <BreadcrumbSeparator />
              <BreadcrumbItemUI>
                <BreadcrumbLink
                  href={`/admin/dashboard/notes/${parent.folderId}`}
                >
                  {parent.folderName}
                </BreadcrumbLink>
              </BreadcrumbItemUI>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {(!items || items.length === 0) && (
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
      {items && items.length > 0 && (
        <div className="w-full flex flex-col gap-0">
          {items.map((item) => {
            const Icon = item.type === "folder" ? FolderIcon : FileTextIcon;
            const href =
              item.type === "folder"
                ? `/admin/dashboard/notes/${item._id}`
                : `/admin/dashboard/notes/${folderId}/${item._id}`;
            const itemLabel = item.type === "folder" ? "Folder" : "Note";

            return (
              <React.Fragment key={item._id}>
                <div className="w-full relative pl-3">
                  <a
                    href={href}
                    className="group flex flex-row items-center gap-1"
                  >
                    <Icon className="text-muted-foreground group-hover:text-foreground transition-colors w-4 h-4 shrink-0" />
                    <p className="text-xs text-left truncate grow">
                      {item.name}
                    </p>
                    <p className="text-xs text-right w-max shrink-0">
                      {format(new Date(item.updatedAt), "Pp").replace(",", "")}
                    </p>
                  </a>
                  <Popover>
                    <PopoverTrigger
                      className="absolute -left-0.5 top-px"
                      asChild
                    >
                      <EllipsisVertical className="w-4 h-4" />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-fit flex flex-col gap-1 p-0! rounded-none!"
                    >
                      <Button
                        className="py-1! px-2 rounded-none text-xs h-fit!"
                        variant="ghost"
                      >
                        <Edit3 />
                        Rename {itemLabel}
                      </Button>
                      <Separator />
                      <Button
                        className="py-1! px-2 rounded-none text-xs h-fit!"
                        variant="ghost"
                      >
                        <Trash />
                        Delete {itemLabel}
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
                <Separator className="my-1 w-full" />
              </React.Fragment>
            );
          })}
        </div>
      )}
    </>
  );
}
