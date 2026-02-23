import { forbidden } from "next/navigation";
import { getAdminSession } from "@/lib/require-admin";
import { LlmUsageDashboard } from "./_components/llm-usage-dashboard";

export default async function Page() {
  const session = await getAdminSession();

  if (!session) {
    forbidden();
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">LLM Usage</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Token consumption, costs, and request history.
        </p>
      </div>
      <LlmUsageDashboard />
    </div>
  );
}
