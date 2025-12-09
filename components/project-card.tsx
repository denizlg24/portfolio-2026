"use client";

import { cn } from "@/lib/utils";
import { ProjectT } from "@/models/Project";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { StyledLink } from "./styled-link";
import { ExternalLinkIcon, Github, FileText } from "lucide-react";

const iconMap = {
  external: ExternalLinkIcon,
  github: Github,
  notepad: FileText,
};
export const ProjectCard = ({
  project,
  className,
}: {
  project: ProjectT;
  className?: string;
}) => {
  return (
    <article className={cn("w-full flex flex-col gap-4 max-w-3xs", className)}>
      <div className="w-full flex flex-col gap-4 group hover:cursor-pointer">
        <Image
          src={project.images[0]}
          alt={project.title}
          width={1920}
          height={1080}
          className="w-full h-auto object-cover rounded-sm drop-shadow-lg aspect-video group-hover:scale-[1.01] group-hover:-translate-y-1 transition-all group-hover:drop-shadow-xl duration-400"
        />
        <h1 className="text-lg font-medium text-left truncate">
          {project.title}
        </h1>
        <h2 className="text-sm text-justify font-light text-muted-foreground line-clamp-4">
          {project.subtitle}
        </h2>

        <div className="flex flex-row items-center justify-start gap-1 flex-wrap w-full">
          {project.tags.map((tag, indx) =>
            indx > 3 ? null : (
              <Badge key={tag} className="text-xs">
                {tag}
              </Badge>
            )
          )}
          {project.tags.length > 4 && (
            <div className="shrink-0 text-sm font-semibold text-muted-foreground self-end">
              ...
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center justify-start gap-1 flex-wrap w-full">
        {project.links.map((link, linkIdx) => {
          const Icon = iconMap[link.icon];
          return (
            <StyledLink
              key={linkIdx}
              type="anchor"
              className="inline-flex items-center gap-1 text-xs"
              href={link.url}
              target="_blank"
            >
              {link.label} <Icon className="w-3 h-3" />
            </StyledLink>
          );
        })}
      </div>
    </article>
  );
};
