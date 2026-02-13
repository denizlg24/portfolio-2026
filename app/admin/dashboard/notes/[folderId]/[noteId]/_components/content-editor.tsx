"use client";

import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ILeanNote } from "@/models/Notes";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { Anthropic } from "@anthropic-ai/sdk/client";
import { Separator } from "@/components/ui/separator";
import { DialogClose } from "@radix-ui/react-dialog";

export const AnthropicModels = [
  "claude-opus-4-5",
  "claude-3-7-sonnet-latest",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-haiku-latest",
  "claude-3-5-haiku-20241022",
  "claude-haiku-4-5",
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-20250514",
  "claude-sonnet-4-0",
  "claude-4-sonnet-20250514",
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-0",
  "claude-opus-4-20250514",
  "claude-4-opus-20250514",
  "claude-opus-4-1-20250805",
  "claude-3-opus-latest",
  "claude-3-opus-20240229",
  "claude-3-haiku-20240307",
];

export const ContentEditor = ({
  note,
  folderId,
}: {
  note: ILeanNote;
  folderId: string;
}) => {
  const [togglePreview, setTogglePreview] = useState(false);
  const [initialContent, setInitialContent] = useState(note.content || "");
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [enhancing, setEnhancing] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [model, setModel] = useState<(typeof AnthropicModels)[number]>(
    "claude-sonnet-4-5-20250929",
  );
  const closeEnhanceDialogRef = useRef<HTMLButtonElement | null>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/notes/${note._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        setInitialContent(content);
      }
    } catch (error) {
      console.error("Error saving note content:", error);
    } finally {
      setLoading(false);
      setTogglePreview(true);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const response = await fetch("/api/admin/notes/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          title: note.title,
          showHeader,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${note.title || "note"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setPdfDialogOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to export PDF");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("An error occurred while exporting the PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    const showPreviewTimeout = setTimeout(() => {
      setTogglePreview(true);
    }, 5000);

    return () => clearTimeout(showPreviewTimeout);
  }, [content]);

  const handleAIEnhance = async () => {
    try {
      setEnhancing(true);
      const response = await fetch(`/api/admin/notes/${note._id}/enhance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(additionalInfo ? { additionalInfo } : {}),
          model,
          content,
        }),
      });
      if (!response.ok) {
        setEnhancing(false);
        toast.error("Failed to enhance note");
        return;
      }
      const data = await response.json();
      setContent(data.enhancedContent);
      setTogglePreview(true);
      toast.success("Note enhanced successfully");
    } catch (error) {
      toast.error("An error occurred while enhancing the note");
    } finally {
      setEnhancing(false);
      closeEnhanceDialogRef.current?.click();
    }
  };

  return (
    <div className="w-full relative">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute top-2 right-2 z-10"
          >
            <Sparkles />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enhance Note with AI</DialogTitle>

            <DialogDescription>
              Use AI to enhance your note by making it more detailed, clear, and
              well-structured.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="model" className="w-32">
                Model
              </Label>
              <Select
                value={model}
                onValueChange={(value) => setModel(value as Anthropic.Model)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="z-99">
                  {AnthropicModels.map((modelKey) => (
                    <SelectItem key={modelKey} value={modelKey}>
                      {modelKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="info" className="w-32">
                Additional Info
              </Label>
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                id="info"
                className="font-mono text-sm h-24 overflow-y-auto rounded-none resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose ref={closeEnhanceDialogRef} asChild>
              <Button variant="outline" disabled={enhancing}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleAIEnhance} disabled={enhancing}>
              {enhancing ? (
                <>
                  Enhancing... <Loader2 className="animate-spin" />
                </>
              ) : (
                "Enhance Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!togglePreview && (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => {
            setTogglePreview(true);
          }}
          id="content"
          className="font-mono text-sm h-[calc(100vh-12rem)] overflow-y-auto rounded-none"
        />
      )}
      {togglePreview && (
        <div
          onClick={() => {
            setTogglePreview(false);
          }}
          className="h-[calc(100vh-12rem)] overflow-y-auto w-full max-w-full! mx-auto border bg-background p-6 border-muted shadow-xs"
        >
          <MarkdownRenderer content={content} />
        </div>
      )}
      <div className="flex flex-row items-center justify-between gap-2 w-full mt-2">
        <div className="flex flex-row items-center gap-1">
          <Button
            disabled={content !== initialContent || loading}
            variant={"outline"}
            size={"icon"}
          >
            <Link href={`/api/admin/notes/${note._id}/download`}>
              <Download />
            </Link>
          </Button>
          <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={content !== initialContent || loading}
                variant={"outline"}
                size={"icon"}
              >
                <FileText />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export to PDF</DialogTitle>
                <DialogDescription>
                  Configure your PDF export options.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 py-4">
                <Checkbox
                  id="showHeader"
                  checked={showHeader}
                  onCheckedChange={(checked) => setShowHeader(checked === true)}
                />
                <Label htmlFor="showHeader" className="cursor-pointer">
                  Include header with logo, title, and date
                </Label>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPdfDialogOpen(false)}
                  disabled={exportingPdf}
                >
                  Cancel
                </Button>
                <Button onClick={handleExportPdf} disabled={exportingPdf}>
                  {exportingPdf ? (
                    <>
                      Exporting... <Loader2 className="animate-spin ml-2" />
                    </>
                  ) : (
                    <>
                      Export PDF <FileText className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-row items-center gap-1">
          <Button
            onClick={handleSave}
            disabled={content === initialContent || loading}
          >
            {loading ? (
              <>
                Saving... <Loader2 className="animate-spin" />
              </>
            ) : (
              "Save file"
            )}
          </Button>
          <Button
            onClick={() => {
              setContent(initialContent);
            }}
            disabled={content === initialContent || loading}
            variant="secondary"
          >
            Discard changes
          </Button>
        </div>
      </div>
    </div>
  );
};
