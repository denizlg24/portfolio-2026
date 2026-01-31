"use client";

import { useEffect } from "react";
import { WhiteboardProvider } from "./_components/whiteboard-provider";
import { WhiteboardCanvas } from "./_components/whiteboard-canvas";
import { WhiteboardToolbar } from "./_components/whiteboard-toolbar";
import { WhiteboardPagesNav } from "./_components/whiteboard-pages-nav";
import { ComponentsLayer } from "./_components/components-layer";

function WhiteboardContent() {
  // Disable page scroll when whiteboard is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6">
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <WhiteboardPagesNav />
        <div className="shrink-0 border-l pl-2">
          <WhiteboardToolbar />
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden bg-muted/30">
        <WhiteboardCanvas />
        <ComponentsLayer />
      </div>
    </div>
  );
}

export default function WhiteboardPage() {
  return (
    <WhiteboardProvider>
      <WhiteboardContent />
    </WhiteboardProvider>
  );
}
