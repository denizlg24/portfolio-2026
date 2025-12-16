"use client";

import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { CommentCard } from "./comment-card";
import { CommentInput } from "./comment-input";

interface Comment {
  _id: string;
  blogId: string;
  commentId?: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface CommentsSectionProps {
  blogId: string;
}

export function CommentsSection({ blogId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/comments?blogId=${blogId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Comments</h2>
        {!loading && comments.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </div>

      <CommentInput blogId={blogId} onCommentSubmitted={fetchComments} />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-6 pt-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              blogId={blogId}
              onDeleted={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
