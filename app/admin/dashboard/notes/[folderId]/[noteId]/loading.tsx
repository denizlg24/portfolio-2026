import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-4">
      <Loader2 className="animate-spin mx-auto w-4 h-4 mt-12" />
    </div>
  );
}
