"use client";

import { Play, Settings, Trash2 } from "lucide-react";
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
import type { ILeanCustomApiEndpoint } from "@/models/CustomApiEndpoint";
import { CallEndpointDialog } from "./call-endpoint-dialog";
import { EndpointFormDialog } from "./endpoint-form-dialog";

const METHOD_COLORS: Record<string, string> = {
    GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    PATCH: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

interface EndpointCardProps {
    apiId: string;
    endpoint: ILeanCustomApiEndpoint;
    onRefresh: () => void;
}

export function EndpointCard({ apiId, endpoint, onRefresh }: EndpointCardProps) {
    const [callOpen, setCallOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/custom-apis/${apiId}/endpoints/${endpoint._id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Failed to delete endpoint");
            }
            toast.success("Endpoint deleted");
            setDeleteOpen(false);
            onRefresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete endpoint");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Card className="p-3">
                <div className="flex items-start gap-3">
                    <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[endpoint.method] ?? ""}`}>
                        {endpoint.method}
                    </span>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{endpoint.name}</span>
                            {!endpoint.isActive && (
                                <Badge variant="secondary" className="text-xs shrink-0">Inactive</Badge>
                            )}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground truncate">{endpoint.path}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{endpoint.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCallOpen(true)}
                            title="Run endpoint"
                        >
                            <Play className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditOpen(true)}
                            title="Edit endpoint"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteOpen(true)}
                            title="Delete endpoint"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>

            <CallEndpointDialog
                open={callOpen}
                onOpenChange={setCallOpen}
                apiId={apiId}
                endpoint={endpoint}
            />

            <EndpointFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                apiId={apiId}
                endpoint={endpoint}
                onSuccess={onRefresh}
            />

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogTitle>Delete Endpoint</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &ldquo;{endpoint.name}&rdquo;? This action cannot be undone.
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
