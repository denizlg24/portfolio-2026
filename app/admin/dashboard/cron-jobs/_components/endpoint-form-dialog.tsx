"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BodyFieldType, ILeanCustomApiEndpoint } from "@/models/CustomApiEndpoint";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const BODY_TYPES: BodyFieldType[] = ["string", "number", "boolean", "object", "string[]", "number[]", "boolean[]", "null"];

interface HeaderEntry { key: string; placeholder: string; }
interface BodyEntry { key: string; type: BodyFieldType; }

interface EndpointFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiId: string;
    endpoint?: ILeanCustomApiEndpoint;
    onSuccess: () => void;
}

export function EndpointFormDialog({ open, onOpenChange, apiId, endpoint, onSuccess }: EndpointFormDialogProps) {
    const isEdit = !!endpoint;
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [path, setPath] = useState("");
    const [method, setMethod] = useState<HttpMethod>("GET");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [headers, setHeaders] = useState<HeaderEntry[]>([]);
    const [bodyFields, setBodyFields] = useState<BodyEntry[]>([]);

    useEffect(() => {
        if (open && endpoint) {
            setName(endpoint.name);
            setPath(endpoint.path);
            setMethod(endpoint.method);
            setDescription(endpoint.description);
            setIsActive(endpoint.isActive);
            setHeaders(Object.entries(endpoint.headers ?? {}).map(([key, placeholder]) => ({ key, placeholder })));
            setBodyFields(Object.entries(endpoint.body ?? {}).map(([key, type]) => ({ key, type })));
        } else if (open && !endpoint) {
            setName(""); setPath(""); setMethod("GET"); setDescription(""); setIsActive(true);
            setHeaders([]); setBodyFields([]);
        }
    }, [open, endpoint]);

    const handleSubmit = async () => {
        if (!name.trim() || !path.trim() || !description.trim()) {
            toast.error("Name, path, and description are required.");
            return;
        }

        const headersObj = headers.reduce<Record<string, string>>((acc, { key, placeholder }) => {
            if (key.trim()) acc[key.trim()] = placeholder;
            return acc;
        }, {});
        const bodyObj = bodyFields.reduce<Record<string, BodyFieldType>>((acc, { key, type }) => {
            if (key.trim()) acc[key.trim()] = type;
            return acc;
        }, {});

        const payload = { name, path, method, description, isActive, headers: headersObj, body: bodyObj };

        setLoading(true);
        try {
            const url = isEdit
                ? `/api/admin/custom-apis/${apiId}/endpoints/${endpoint!._id}`
                : `/api/admin/custom-apis/${apiId}/endpoints`;
            const res = await fetch(url, {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Failed to save endpoint");
            }

            toast.success(isEdit ? "Endpoint updated" : "Endpoint created");
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save endpoint");
        } finally {
            setLoading(false);
        }
    };

    const addHeader = () => setHeaders((h) => [...h, { key: "", placeholder: "" }]);
    const removeHeader = (i: number) => setHeaders((h) => h.filter((_, idx) => idx !== i));
    const updateHeader = (i: number, field: keyof HeaderEntry, value: string) =>
        setHeaders((h) => h.map((entry, idx) => idx === i ? { ...entry, [field]: value } : entry));

    const addBodyField = () => setBodyFields((b) => [...b, { key: "", type: "string" }]);
    const removeBodyField = (i: number) => setBodyFields((b) => b.filter((_, idx) => idx !== i));
    const updateBodyField = (i: number, field: keyof BodyEntry, value: string) =>
        setBodyFields((b) => b.map((entry, idx) => idx === i ? { ...entry, [field]: value } : entry));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogTitle>{isEdit ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle>
                <DialogDescription>
                    {isEdit ? "Update the endpoint configuration." : "Define a new endpoint for this API."}
                </DialogDescription>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input placeholder="Trigger Job" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1.5 col-span-1">
                            <Label>Method</Label>
                            <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(["GET", "POST", "PUT", "DELETE", "PATCH"] as HttpMethod[]).map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label>Path</Label>
                            <Input placeholder="/api/trigger" value={path} onChange={(e) => setPath(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea placeholder="What does this endpoint do?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                    </div>

                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Headers</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                            </Button>
                        </div>
                        {headers.length === 0 && (
                            <p className="text-xs text-muted-foreground">No headers defined.</p>
                        )}
                        {headers.map((h, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    placeholder="Header name"
                                    value={h.key}
                                    onChange={(e) => updateHeader(i, "key", e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Placeholder / hint"
                                    value={h.placeholder}
                                    onChange={(e) => updateHeader(i, "placeholder", e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeHeader(i)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Body Schema</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addBodyField}>
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                            </Button>
                        </div>
                        {bodyFields.length === 0 && (
                            <p className="text-xs text-muted-foreground">No body fields defined.</p>
                        )}
                        {bodyFields.map((b, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    placeholder="Field name"
                                    value={b.key}
                                    onChange={(e) => updateBodyField(i, "key", e.target.value)}
                                    className="flex-1"
                                />
                                <Select value={b.type} onValueChange={(v) => updateBodyField(i, "type", v)}>
                                    <SelectTrigger className="w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BODY_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeBodyField(i)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="epIsActive"
                            checked={isActive}
                            onCheckedChange={(v) => setIsActive(!!v)}
                        />
                        <Label htmlFor="epIsActive">Active</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEdit ? "Saving..." : "Creating..."}</> : isEdit ? "Save Changes" : "Create Endpoint"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
