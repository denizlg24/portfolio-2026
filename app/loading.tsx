import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <Loader2Icon className="animate-spin w-6 h-6 text-accent"/>
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </main>
  );
}