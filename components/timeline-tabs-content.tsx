
import { getTimelineItemsByCategory } from "@/lib/timeline";
import { StyledLink } from "./styled-link";
import { TimelineCard } from "./timeline-card";
import Image from "next/image";
import { ExternalLinkIcon, Github, FileText } from "lucide-react";
const iconMap = {
  external: ExternalLinkIcon,
  github: Github,
  notepad: FileText,
};

export default async function TimelineTabsContent({
  category,
}: {
  category: "work" | "education" | "personal";
}) {
  const timelineItems = await getTimelineItemsByCategory();

  return timelineItems[category].map((item, idx) => {
    return (
      <TimelineCard
        key={idx}
        item={{
          logo: item.logoUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-background overflow-hidden">
              <Image
                className="w-full h-auto aspect-square object-cover"
                width={64}
                height={64}
                src={item.logoUrl}
                alt={item.title}
              />
            </div>
          ) : undefined,
          title: item.title,
          subtitle: item.subtitle,
          date: { from: item.dateFrom, to: item.dateTo },
          topics: item.topics,
        }}
      >
        {item.links && item.links.length > 0 && (
          <div className="flex flex-row items-center gap-2 flex-wrap mt-1">
            {item.links.map((link, linkIdx) => {
              const Icon = iconMap[link.icon];
              return (
                <StyledLink
                  key={linkIdx}
                  type="anchor"
                  className="inline-flex items-center gap-1 text-sm"
                  href={link.url}
                  target="_blank"
                >
                  {link.label} <Icon className="w-3.5 h-3.5" />
                </StyledLink>
              );
            })}
          </div>
        )}
      </TimelineCard>
    );
  });
}
