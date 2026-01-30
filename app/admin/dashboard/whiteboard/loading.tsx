export default function WhiteboardLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-background/95">
        <div className="flex items-center gap-1">
          <div className="h-7 w-20 bg-muted animate-pulse rounded" />
          <div className="h-7 w-20 bg-muted animate-pulse rounded" />
          <div className="h-7 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-1 border-l pl-2">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
        Loading whiteboard...
      </div>
    </div>
  );
}
