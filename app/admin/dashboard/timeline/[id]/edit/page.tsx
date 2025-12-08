import { TimelineForm } from "../../_components/timeline-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/require-admin";
import { getTimelineItemById } from "@/lib/timeline";

export default async function EditTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Verify admin access
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { id } = await params;

  // Fetch directly from database instead of API route
  // This avoids cookie/header forwarding issues with internal fetch()
  const item = await getTimelineItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/timeline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Timeline Item</h1>
          <p className="text-muted-foreground">
            Update your timeline card details.
          </p>
        </div>
      </div>

      <div className="bg-background">
        <TimelineForm mode="edit" initialData={item} />
      </div>
    </>
  );
}
