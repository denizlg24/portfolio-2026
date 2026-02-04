"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  return (
    <div className="w-full">
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
            asChild
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
