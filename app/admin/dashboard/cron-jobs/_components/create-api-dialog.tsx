"use client";

import { Loader2 } from "lucide-react";
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

interface ApiFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api?: {
    _id: string;
    name: string;
    baseUrl: string;
    description: string;
    isActive: boolean;
    apiType: string;
  };
  onSuccess: () => void;
}

export function CreateApiDialog({ open, onOpenChange, api, onSuccess }: ApiFormDialogProps) {
  const isEdit = !!api;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [apiType, setApiType] = useState("generic");

  useEffect(() => {
    if (open && api) {
      setName(api.name);
      setBaseUrl(api.baseUrl);
      setDescription(api.description);
      setIsActive(api.isActive);
      setApiType(api.apiType ?? "generic");
    } else if (open && !api) {
      setName(""); setBaseUrl(""); setDescription(""); setIsActive(true); setApiType("generic");
    }
  }, [open, api]);

  const handleSubmit = async () => {
    if (!name.trim() || !baseUrl.trim() || !description.trim()) {
      toast.error("Name, base URL, and description are required.");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/custom-apis/${api!._id}` : "/api/admin/custom-apis";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseUrl, description, isActive, apiType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed to ${isEdit ? "update" : "create"} connection`);
      }

      toast.success(isEdit ? "Connection updated" : "Connection created");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{isEdit ? "Edit Connection" : "Add Connection"}</DialogTitle>
        <DialogDescription>
          {apiType === "picron"
            ? "PiCron credentials are read from PICRON_USERNAME and PICRON_PASSWORD environment variables."
            : "Configure the connection details for this API."}
        </DialogDescription>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="My Pi" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Base URL</Label>
            <Input
              placeholder={apiType === "picron" ? "http://raspberrypi.local:8080" : "https://api.example.com"}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="What runs on this API?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={apiType} onValueChange={setApiType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generic">Generic API</SelectItem>
                <SelectItem value="picron">PiCron</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="apiIsActive" checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
            <Label htmlFor="apiIsActive">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEdit ? "Saving…" : "Creating…"}</>
              : isEdit ? "Save Changes" : "Add Connection"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
