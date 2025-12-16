"use client";

import Cookies from "js-cookie";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const COMMENTER_COOKIE = "blog_commenter";

interface CommenterInfo {
  name: string;
}

function generateAnonymousName(): string {
  const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `Anonymous ${randomId}`;
}

function getCommenterInfo(): CommenterInfo | null {
  const cookie = Cookies.get(COMMENTER_COOKIE);
  if (cookie) {
    try {
      return JSON.parse(cookie);
    } catch {
      return null;
    }
  }
  return null;
}

function setCommenterInfo(info: CommenterInfo): void {
  Cookies.set(COMMENTER_COOKIE, JSON.stringify(info), { expires: 365 });
}

interface CommentInputProps {
  blogId: string;
  parentCommentId?: string;
  onCommentSubmitted?: () => void;
  placeholder?: string;
  isReply?: boolean;
}

export function CommentInput({
  blogId,
  parentCommentId,
  onCommentSubmitted,
  placeholder = "Write a comment...",
  isReply = false,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [_hasExistingIdentity, setHasExistingIdentity] = useState(false);

  useEffect(() => {
    const info = getCommenterInfo();
    if (info) {
      setHasExistingIdentity(true);
    }
  }, []);

  const handleInputSubmit = () => {
    if (!content.trim()) {
      toast.error("Please write a comment first");
      return;
    }

    // If user already has a cookie, submit directly
    const existingInfo = getCommenterInfo();
    if (existingInfo) {
      submitComment(existingInfo.name);
    } else {
      setDialogOpen(true);
    }
  };

  const handleDialogSubmit = () => {
    const finalName = nameInput.trim() || generateAnonymousName();
    setCommenterInfo({ name: finalName });
    setHasExistingIdentity(true);
    submitComment(finalName);
  };

  const submitComment = async (authorName: string) => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId,
          commentId: parentCommentId,
          authorName,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      setContent("");
      setNameInput("");
      setDialogOpen(false);
      onCommentSubmitted?.();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to submit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${isReply ? "" : "w-full"}`}>
        <div className="relative flex-1">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className={isReply ? "text-sm h-9" : ""}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleInputSubmit();
              }
            }}
          />
        </div>
        <Button
          size={isReply ? "sm" : "default"}
          onClick={handleInputSubmit}
          disabled={!content.trim() || submitting}
        >
          <Send className="w-4 h-4" />
          <span className="sr-only">Submit</span>
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">What's your name?</DialogTitle>
          </DialogHeader>

          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Leave empty to stay anonymous"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleDialogSubmit();
              }
            }}
            autoFocus
          />

          <DialogFooter>
            <Button
              onClick={handleDialogSubmit}
              disabled={submitting}
              className="w-full"
              size="sm"
            >
              {submitting ? "Posting..." : "Post comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
