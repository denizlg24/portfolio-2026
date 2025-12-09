import { InstagramPostsGallery } from "@/components/instagram-posts-gallery";
import { getAge } from "@/lib/utils";
import Image from "next/image";
import {
  ExternalLinkIcon,
  FileDown,
  Github,
  Instagram,
  Linkedin,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllInstagramPosts } from "@/lib/instagram_posts";
import { StyledLink } from "@/components/styled-link";
import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline } from "@/components/timeline";
import { TimelineCard } from "@/components/timeline-card";
import { getTimelineItemsByCategory } from "@/lib/timeline";
import { getActiveProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/project-card";

export const metadata: Metadata = {
  title: {
    absolute: "Home | Deniz Lopes Güneş",
  },
  description:
    "Hi, I'm Deniz, a 21 year old software engineer from Portugal. Co-founder and sole developer at Ocean Informatix. Former national-level athlete in handball and American football.",
  openGraph: {
    title: "Home | Deniz Lopes Güneş",
    description:
      "Hi, I'm Deniz, a 21 year old software engineer from Portugal. Co-founder and sole developer at Ocean Informatix.",
    url: "https://denizlg24.com",
  },
};

const iconMap = {
  external: ExternalLinkIcon,
  github: Github,
  notepad: FileText,
};

export default async function Home() {
  const posts = await getAllInstagramPosts();
  const timelineItems = await getTimelineItemsByCategory();
  const projects = await getActiveProjects();
  return (
    <main className="flex flex-col items-center justify-center">
      <section className="w-full max-w-5xl mx-auto px-4 text-center items-center">
        <h1 className="sm:text-5xl text-4xl text-balance font-calistoga text-center">
          hi, deniz here.
        </h1>
        <h2 className="mt-2 whitespace-nowrap text-sm font-medium sm:text-base text-center inline-flex items-center justify-center gap-1">
          {getAge("2004-04-24")} yo software engineer from Portugal
          <Image
            src="/portugal-flag.svg"
            alt="portugal flag"
            width={600}
            height={400}
            className="w-5 h-auto aspect-[1.5] object-contain rounded"
          />
        </h2>
      </section>
      <InstagramPostsGallery
        items={posts
          .filter((post) => post.media_type != "VIDEO")
          .map((post) => ({
            image: post.media_url,
            text: new Date(post.timestamp).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            link: post.permalink,
          }))}
      />
      <section className="w-full max-w-5xl mx-auto px-4 md:grid flex flex-col-reverse grid-cols-5 gap-6 mt-6 items-center">
        <article className="col-span-3 flex flex-col items-start gap-6 w-full">
          <h1 className="sm:text-4xl text-3xl text-balance font-calistoga w-full text-center">
            about me
          </h1>
          <p className="sm:text-base text-sm">
            I&apos;m Deniz, a developer from Portugal with a background shaped
            heavily by competitive sports. Before diving into software, I spent
            years playing handball at a national level and later{" "}
            <StyledLink
              type="anchor"
              href="https://www.zerozero.pt/noticias/-a-minha-cabeca-ficou-saturada-do-andebol-da-selecao-para-o-futebol-americano-/684576"
              target="_blank"
            >
              American Football
            </StyledLink>
            , representing Portugal{" "}
            <StyledLink
              type="anchor"
              href="https://www.zerozero.pt/noticias/sub-20-carlos-martingo-chama-16-atletas-para-o-torneio-4-nacoes/569584"
              target="_blank"
            >
              internationally
            </StyledLink>{" "}
            and even signing to play in Germany. Those experiences taught me
            discipline, focus, and how to handle pressure — qualities that now
            influence the way I approach engineering and problem-solving.
          </p>
          <p className="sm:text-base text-sm">
            Today, I&apos;m completing my degree in Computing and Informatics
            Engineering at FEUP while building real-world products as the
            co-founder and sole developer at{" "}
            <StyledLink
              type="anchor"
              href="https://oceaninformatix.com"
              target="_blank"
            >
              Ocean Informatix
            </StyledLink>
            . I work across the full stack, creating web applications, custom
            software, and modern digital experiences for clients. I enjoy
            designing systems end-to-end, experimenting with new technologies,
            and building products that feel simple, reliable, and meaningful to
            use.
          </p>
        </article>
        <div className="col-span-2 w-full flex flex-col items-center gap-2">
          <div className="rounded-t-full h-auto aspect-[0.8] bg-accent w-full overflow-hidden sm:max-w-2xs max-w-3xs border shadow flex flex-col items-center justify-end group">
            <Image
              src="/headshot-square.png"
              alt="Deniz profile picture"
              width={512}
              height={512}
              className="w-full h-auto aspect-square object-cover translate-y-2 group-hover:translate-y-0 transition-transform duration-300 drop-shadow-2xl"
            />
          </div>
          <div className="flex justify-between w-full sm:max-w-2xs max-w-3xs gap-4 items-center mx-auto">
            <Button variant={"secondary"} className="w-fit" asChild>
              <a href="/assets/DenizGunesCV2025.pdf" target="_blank">
                Resume <FileDown />
              </a>
            </Button>
            <a
              href="https://www.linkedin.com/in/deniz-g%C3%BCnes-068509263/"
              className="text-accent hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/denizlg24"
              className="text-accent hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/denizlg24"
              className="text-accent hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="mailto:denizlg24@gmail.com"
              className="text-accent hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
      <section className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-6 mt-16">
        <Tabs defaultValue="work" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>
          <TabsContent value="work" className="mt-4">
            <Timeline>
              {timelineItems.work.map((item, idx) => {
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
              })}
            </Timeline>
          </TabsContent>
          <TabsContent value="education" className="mt-4">
            <Timeline>
              {timelineItems.education.map((item: any) => (
                <TimelineCard
                  key={item._id.toString()}
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
                      {item.links.map((link: any, linkIdx: number) => {
                        const Icon = iconMap[link.icon as keyof typeof iconMap];
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
              ))}
            </Timeline>
          </TabsContent>
          <TabsContent value="personal" className="mt-4">
            <Timeline>
              {timelineItems.personal.map((item: any) => (
                <TimelineCard
                  key={item._id.toString()}
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
                      {item.links.map((link: any, linkIdx: number) => {
                        const Icon = iconMap[link.icon as keyof typeof iconMap];
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
              ))}
            </Timeline>
          </TabsContent>
        </Tabs>
      </section>
      <section className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-6 mt-16">
        <h1 className="sm:text-4xl text-3xl text-balance font-calistoga w-full text-center">
          featured projects
        </h1>
        <div className="grid md:grid-cols-3 xs:grid-cols-2 grid-cols-1 gap-4">
          {projects.slice(0, 2).map((project) => (
            <ProjectCard
            key={project._id.toString()}
            className="max-w-full col-span-1"
              project={{
                ...project,
                links: project.links.map((link) => ({
                  label: link.label,
                  icon: link.icon,
                  url: link.url,
                })),
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
