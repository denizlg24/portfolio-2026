"use client";

import { Loader2, Play } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { BodyFieldType, ILeanCustomApiEndpoint } from "@/models/CustomApiEndpoint";

interface CallResult {
    status: number;
    statusText: string;
    duration: number;
    body: unknown;
}

interface CallEndpointDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiId: string;
    endpoint: ILeanCustomApiEndpoint;
}

function parseBodyValue(value: string, type: BodyFieldType): unknown {
    switch (type) {
        case "string": return value;
        case "number": return Number(value);
        case "boolean": return value === "true";
        case "null": return null;
        default:
            try { return JSON.parse(value); } catch { return value; }
    }
}

export function CallEndpointDialog({ open, onOpenChange, apiId, endpoint }: CallEndpointDialogProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CallResult | null>(null);
    const [headerValues, setHeaderValues] = useState<Record<string, string>>({});
    const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
    const [boolValues, setBoolValues] = useState<Record<string, boolean>>({});

    const headerEntries = Object.entries(endpoint.headers ?? {});
    const bodyEntries = Object.entries(endpoint.body ?? {});
    const hasBody = bodyEntries.length > 0 && !["GET", "DELETE"].includes(endpoint.method);

    const handleCall = async () => {
        setLoading(true);
        setResult(null);

        const parsedBody = bodyEntries.reduce<Record<string, unknown>>((acc, [key, type]) => {
            acc[key] = type === "boolean"
                ? (boolValues[key] ?? false)
                : parseBodyValue(bodyValues[key] ?? "", type);
            return acc;
        }, {});

        try {
            const res = await fetch(`/api/admin/custom-apis/${apiId}/endpoints/${endpoint._id}/call`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ headers: headerValues, body: parsedBody }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error ?? "Call failed");
            }

            setResult(data);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to call endpoint");
        } finally {
            setLoading(false);
        }
    };

    const statusColor = result
        ? result.status >= 200 && result.status < 300
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
            : result.status >= 400
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
        : "";

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setResult(null); setHeaderValues({}); setBodyValues({}); setBoolValues({}); } }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogTitle>Run Endpoint</DialogTitle>
                <DialogDescription>
                    <span className="font-mono text-xs">{endpoint.method} {endpoint.path}</span>
                    {" — "}{endpoint.description}
                </DialogDescription>

                <div className="space-y-4">
                    
                    {headerEntries.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Headers</Label>
                            {headerEntries.map(([key, placeholder]) => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{key}</Label>
                                    <Input
                                        placeholder={placeholder || key}
                                        value={headerValues[key] ?? ""}
                                        onChange={(e) => setHeaderValues((h) => ({ ...h, [key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    
                    {hasBody && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Body</Label>
                            {bodyEntries.map(([key, type]) => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                        {key} <span className="opacity-50">({type})</span>
                                    </Label>
                                    {type === "boolean" ? (
                                        <div className="flex items-center gap-2 h-9">
                                            <Checkbox
                                                checked={boolValues[key] ?? false}
                                                onCheckedChange={(v) => setBoolValues((b) => ({ ...b, [key]: !!v }))}
                                            />
                                            <span className="text-sm">{boolValues[key] ? "true" : "false"}</span>
                                        </div>
                                    ) : type === "null" ? (
                                        <Input value="null" disabled />
                                    ) : type === "object" || type.endsWith("[]") ? (
                                        <Textarea
                                            placeholder={`Enter JSON for ${key}`}
                                            value={bodyValues[key] ?? ""}
                                            onChange={(e) => setBodyValues((b) => ({ ...b, [key]: e.target.value }))}
                                            rows={3}
                                            className="font-mono text-xs"
                                        />
                                    ) : (
                                        <Input
                                            type={type === "number" ? "number" : "text"}
                                            placeholder={key}
                                            value={bodyValues[key] ?? ""}
                                            onChange={(e) => setBodyValues((b) => ({ ...b, [key]: e.target.value }))}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    
                    {result && (
                        <div className="space-y-2 border rounded-md p-3">
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded font-mono font-semibold ${statusColor}`}>
                                    {result.status} {result.statusText}
                                </span>
                                <span className="text-muted-foreground">{result.duration}ms</span>
                            </div>
                            <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-60 whitespace-pre-wrap break-all">
                                {typeof result.body === "string"
                                    ? result.body
                                    : JSON.stringify(result.body, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Close
                    </Button>
                    <Button onClick={handleCall} disabled={loading}>
                        {loading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calling...</>
                            : <><Play className="w-4 h-4 mr-2" />Run</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
