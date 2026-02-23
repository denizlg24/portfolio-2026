"use client";

import {
  ChevronLeftCircle,
  ChevronRightCircle,
  ClipboardX,
  Download,
  Edit2,
  Eye,
  FileText,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { DialogClose } from "@radix-ui/react-dialog";
import { ModelSelector } from "@/components/model-selector";

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
  const [model, setModel] = useState<string>("claude-haiku-4-5");
  const [toolbarOpen, setToolbarOpen] = useState(false);

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

      closeEnhanceDialogRef.current?.click();
      setTogglePreview(true);
      setContent("");

      const reader = response.body
        ?.pipeThrough(new TextDecoderStream())
        .getReader();
      if (!reader) {
        toast.error("Failed to read stream");
        setEnhancing(false);
        return;
      }

      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");

        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);
            if (event.type === "delta") {
              accumulated += event.text;
              setContent(accumulated);
            } else if (event.type === "done") {
              const { inputTokens, outputTokens, costUsd } = event.usage;
              toast.success(
                `Enhanced — ${inputTokens + outputTokens} tokens ($${costUsd.toFixed(4)})`,
              );
            } else if (event.type === "error") {
              toast.error(event.error ?? "Stream error");
            }
          } catch {}
        }
      }
    } catch (error) {
      toast.error("An error occurred while enhancing the note");
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="w-full relative">
      {toolbarOpen ? (
        <div className="flex flex-col gap-1 items-center absolute sm:right-2 right-0 sm:top-4 z-10 px-1 py-2 border shadow rounded-full bg-surface">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setTogglePreview((prev) => !prev)}
          >
            {togglePreview ? <Edit2 /> : <Eye />}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon-sm" className="">
                <Sparkles />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Enhance Note with AI</DialogTitle>

                <DialogDescription>
                  Use AI to enhance your note by making it more detailed, clear,
                  and well-structured.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-start gap-1">
                  <Label htmlFor="model" className="w-32">
                    Model
                  </Label>
                  <ModelSelector model={model} onModelChange={setModel} />
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
                <DialogClose asChild>
                  <Button
                    ref={closeEnhanceDialogRef}
                    variant="outline"
                    disabled={enhancing}
                  >
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
          <Button
            onClick={handleSave}
            size="icon-sm"
            disabled={content === initialContent || loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
              </>
            ) : (
              <Save />
            )}
          </Button>
          <Button
            onClick={() => {
              setContent(initialContent);
            }}
            disabled={content === initialContent || loading}
            variant="secondary"
            size="icon-sm"
          >
            <ClipboardX />
          </Button>
          <Button
            variant={"outline"}
            size={"icon-sm"}
            className="rounded-full"
            onClick={() => setToolbarOpen(false)}
          >
            <ChevronRightCircle />
          </Button>
        </div>
      ) : (
        <Button
          variant={"outline"}
          size={"icon-sm"}
          className="absolute sm:top-4 sm:right-2 right-0 rounded-full"
          onClick={() => setToolbarOpen(true)}
        >
          <ChevronLeftCircle />
        </Button>
      )}

      {!togglePreview && (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          id="content"
          className="font-mono text-sm h-[calc(100vh-8rem)] overflow-y-auto rounded-none border-none! outline-none! ring-0! shadow-none!"
        />
      )}
      {togglePreview && (
        <div className="h-[calc(100vh-8rem)] overflow-y-auto w-full max-w-full! mx-auto bg-background px-3 py-2">
          <MarkdownRenderer content={content} />
        </div>
      )}
    </div>
  );
};
