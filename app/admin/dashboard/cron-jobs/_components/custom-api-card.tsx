"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { CreateApiDialog } from "./create-api-dialog";
import type { ApiWithEndpoints } from "./cron-jobs-manager";
import { EndpointCard } from "./endpoint-card";
import { EndpointFormDialog } from "./endpoint-form-dialog";

interface CustomApiCardProps {
    api: ApiWithEndpoints;
    onRefresh: () => void;
}

export function CustomApiCard({ api, onRefresh }: CustomApiCardProps) {
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/custom-apis/${api._id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Failed to delete API");
            }
            toast.success("API deleted");
            setDeleteOpen(false);
            onRefresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete API");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-semibold text-base">{api.name}</h2>
                                <Badge variant={api.isActive ? "default" : "secondary"} className="text-xs">
                                    {api.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{api.baseUrl}</p>
                            <p className="text-sm text-muted-foreground mt-1">{api.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Endpoint
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditOpen(true)}
                                title="Edit API"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteOpen(true)}
                                title="Delete API"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {api.endpoints.length > 0 && (
                    <CardContent className="pt-0 space-y-2">
                        <p className="text-xs text-muted-foreground mb-1">
                            {api.endpoints.length} endpoint{api.endpoints.length !== 1 ? "s" : ""}
                        </p>
                        {api.endpoints.map((endpoint) => (
                            <EndpointCard
                                key={endpoint._id}
                                apiId={api._id}
                                endpoint={endpoint}
                                onRefresh={onRefresh}
                            />
                        ))}
                    </CardContent>
                )}

                {api.endpoints.length === 0 && (
                    <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No endpoints yet.{" "}
                            <button className="underline hover:no-underline" onClick={() => setAddOpen(true)}>
                                Add one
                            </button>
                        </p>
                    </CardContent>
                )}
            </Card>

            <EndpointFormDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                apiId={api._id}
                onSuccess={onRefresh}
            />

            <CreateApiDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                api={{ _id: api._id, name: api.name, baseUrl: api.baseUrl, description: api.description, isActive: api.isActive, apiType: api.apiType }}
                onSuccess={onRefresh}
            />

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogTitle>Delete API</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &ldquo;{api.name}&rdquo; and all its endpoints? This action cannot be undone.
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
