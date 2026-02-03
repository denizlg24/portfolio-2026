"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ILeanFolder } from "@/models/Folder";
import { ILeanNote } from "@/models/Notes";
import { useEffect, useState } from "react";

export const ContentEditor = ({
  note,
  folderId,
}: {
  note: ILeanNote;
  folderId: string;
}) => {
  const [togglePreview, setTogglePreview] = useState(false);
  const [content, setContent] = useState(note.content || "");

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
          className="h-[calc(100vh-12rem)] overflow-y-auto w-full max-w-full! mx-auto border bg-background px-4 border-muted shadow-xs"
        >
          <MarkdownRenderer content={content} />
        </div>
      )}
       <div className="flex flex-row items-center justify-end gap-2 w-full mt-2">
        <Button disabled={content === note.content}>Save file</Button>
        <Button
          onClick={() => {
            setContent(note.content);
          }}
          disabled={content === note.content}
          variant="secondary"
        >
          Discard changes
        </Button>
      </div>
    </div>
  );
};
