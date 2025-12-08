import { TimelineManager } from "./_components/timeline-manager";
import { getAllTimelineItems } from "@/lib/timeline";
import { getAdminSession } from "@/lib/require-admin";
import { ForbiddenError } from "@/lib/utils";

export default async function TimelinePage() {
  const session = await getAdminSession();

  if (!session) {
    throw new ForbiddenError("Forbidden");
  }

  const items = await getAllTimelineItems();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <TimelineManager
        initialItems={items.map((item) => ({
          _id: (item._id as string).toString(),
          title: item.title,
          subtitle: item.subtitle,
          logoUrl: item.logoUrl,
          dateFrom: item.dateFrom,
          dateTo: item.dateTo,
          topics: item.topics,
          category: item.category,
          order: item.order,
          links: item.links?.map((link) => ({
            label: link.label,
            url: link.url,
            icon: link.icon,
          })),
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }))}
      />
    </div>
  );
}
