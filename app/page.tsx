import { InstagramPostsGallery } from "@/components/instagram-posts-gallery";
import portugalFlag from "@/public/portugal-flag.svg";
import { getAge } from "@/lib/utils";
import Image from "next/image";
import {
  ExternalLinkIcon,
  FileDown,
  Github,
  Instagram,
  Linkedin,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllInstagramPosts } from "@/lib/instagram_posts";
import { StyledLink } from "@/components/styled-link";
import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline } from "@/components/timeline";
import { TimelineCard } from "@/components/timeline-card";

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

export default async function Home() {
  const posts = await getAllInstagramPosts();
  return (
    <main className="flex flex-col items-center justify-center">
      <section className="w-full max-w-5xl mx-auto px-4 text-center items-center">
        <h1 className="sm:text-5xl text-4xl text-balance font-calistoga text-center">
          hi, deniz here.
        </h1>
        <h2 className="mt-2 whitespace-nowrap text-sm font-medium sm:text-base text-center inline-flex items-center justify-center gap-1">
          {getAge("2004-04-24")} yo software engineer from Portugal
          <Image
            src={portugalFlag}
            alt=""
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
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-background rounded-full overflow-hidden">
                      <Image
                        className="w-full h-auto aspect-square object-cover"
                        width={64}
                        height={64}
                        src={"/assets/logos/logo_ocean_informatix.png"}
                        alt={"Ocean Informatix"}
                      />
                    </div>
                  ),
                  title: "Ocean Informatix",
                  subtitle: "Co-founder & Lead Software Engineer",
                  date: { from: "Jan 2024" },
                  topics: [
                    "Architected and developed full-stack web applications for multiple clients using various typescript frameworks",
                    "Built custom e-commerce solutions integrating payment gateways and analytics dashboards for retail businesses",
                    "Designed and implemented RESTful APIs and database schemas using MongoDB and PostgreSQL",
                    "Led client discovery sessions and project planning, translating business requirements into technical specifications",
                  ],
                }}
              >
                <div className="flex flex-row items-center gap-2 flex-wrap mt-1">
                  <StyledLink
                    type="anchor"
                    className="inline-flex items-center gap-1 text-sm"
                    href="https://oceaninformatix.com"
                    target="_blank"
                  >
                    Website <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </StyledLink>
                </div>
              </TimelineCard>
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-[#7b5952] rounded-full overflow-hidden p-1.5">
                      <Image
                        className="w-full h-auto aspect-square object-cover"
                        width={64}
                        height={64}
                        src={"/assets/logos/alojamento-ideal-logo.png"}
                        alt={"Alojamento Ideal"}
                      />
                    </div>
                  ),
                  title: "Alojamento Ideal",
                  subtitle: "Freelance Work",
                  date: { from: "May 2025", to: "Oct 2025" },
                  topics: [
                    "Engineered a custom property-management platform using Next.js, TypeScript, and serverless APIs, integrating real-time availability syncing, automated booking logic, and an optimized image pipeline tailored for high-volume property listings.",
                    "Gained extensive experience collaborating with non-technical stakeholders, refining requirements through iterative feedback, and delivering production-ready software under tight deadlines while maintaining clean architecture and scalability.",
                  ],
                }}
              >
                <div className="flex flex-row items-center gap-2 flex-wrap mt-1">
                  <StyledLink
                    type="anchor"
                    className="inline-flex items-center gap-1 text-sm"
                    href="https://alojamentoideal.pt"
                    target="_blank"
                  >
                    Website <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </StyledLink>
                  <StyledLink
                    type="anchor"
                    className="inline-flex items-center gap-1 text-sm"
                    href="https://github.com/denizlg24/alojamentoideal"
                    target="_blank"
                  >
                    Repository <Github className="w-3.5 h-3.5" />
                  </StyledLink>
                </div>
              </TimelineCard>
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-accent rounded-full overflow-hidden p-0.5">
                      <Image
                        className="w-full h-auto aspect-square object-cover"
                        width={64}
                        height={64}
                        src={"/assets/logos/grama_logo.png"}
                        alt={"Restaurante Grama"}
                      />
                    </div>
                  ),
                  title: "Restaurante Grama",
                  subtitle: "Freelance Work",
                  date: { from: "Nov 2024", to: "Dec 2024" },
                  topics: [
                    "Built a fast, SEO-optimized static website for Restaurante Grama using Next.js and TypeScript, implementing responsive layouts, structured metadata, and efficient image delivery to showcase menus and brand identity with high performance.",
                    "Improved my client communication and product-thinking skills by translating the restaurant’s visual and functional needs into a clean, accessible user experience, ensuring the final site aligned with their brand and customer flow.",
                  ],
                }}
              >
                <div className="flex flex-row items-center gap-2 flex-wrap mt-1">
                  <StyledLink
                    type="anchor"
                    className="inline-flex items-center gap-1 text-sm"
                    href="https://restaurantegrama.pt"
                    target="_blank"
                  >
                    Website <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </StyledLink>
                  <StyledLink
                    type="anchor"
                    className="inline-flex items-center gap-1 text-sm"
                    href="https://github.com/denizlg24/restaurantegrama.pt"
                    target="_blank"
                  >
                    Repository <Github className="w-3.5 h-3.5" />
                  </StyledLink>
                </div>
              </TimelineCard>
            </Timeline>
          </TabsContent>
          <TabsContent value="education" className="mt-4">
            <Timeline>
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden p-px">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/logo_feup.png"}
                        alt={"Faculdade de Engenharia da Universidade do Porto"}
                      />
                    </div>
                  ),
                  title: "Faculdade de Engenharia da Universidade do Porto",
                  subtitle:
                    "Bachelor's in Computing and Informatics Engineering",
                  date: { from: "Sep 2022", to: "Expected Jun 2026" },
                  topics: [
                    "Developed strong foundations in algorithms, data structures, computer architecture, and software engineering, applying these concepts in practical projects using languages such as Java, C, C++, and Python.",
                    "Gained extensive experience working in collaborative, project-based environments, improving my problem-solving, communication, and system-design skills through team assignments and real-world software challenges.",
                  ],
                }}
              ></TimelineCard>
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/logo_gcu.png"}
                        alt={"Faculdade de Engenharia da Universidade do Porto"}
                      />
                    </div>
                  ),
                  title: "Grande Colégio Universal",
                  subtitle:
                    "High School Diploma in Science and Technology (4.0 GPA)",
                  date: { from: "Sep 2019", to: "Jul 2022" },
                  topics: [
                    "Graduated with a 4.0 GPA and multiple academic distinctions, earning top marks across the Science and Technology track while representing the school in national Mathematics Olympiads and related competitions.",
                    "Developed strong analytical thinking and discipline through advanced coursework and award-winning academic performance, while taking part in initiatives that strengthened teamwork, leadership, and problem-solving abilities.",
                  ],
                }}
              ></TimelineCard>
            </Timeline>
          </TabsContent>
          <TabsContent value="personal" className="mt-4">
            <Timeline>
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden p-1">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/unicorns.png"}
                        alt={"Schwäbisch Hall Unicorns"}
                      />
                    </div>
                  ),
                  title: "Schwäbisch Hall Unicorns",
                  subtitle: "American Football - Offensive Line",
                  date: { from: "Jun 2024", to: "Sep 2024" },
                  topics: [
                    "Played in Germany with the Schwäbisch Hall Unicorns, winning the South Division and competing in one of Europe's highest-level American football programs.",
                    "Gained international athletic experience, adapting to new cultures, systems, and training intensities while improving physical performance and teamwork under elite coaching.",
                  ],
                }}
              />
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-background rounded-full overflow-hidden p-px">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/mutts.png"}
                        alt={"Maia Mutts American Football"}
                      />
                    </div>
                  ),
                  title: "Maia Mutts - American Football",
                  subtitle: "Offensive Lineman / Rookie Transition",
                  date: { from: "Dec 2023", to: "May 2024" },
                  topics: [
                    "Transitioned from handball to American football, quickly adapting to a new sport and earning a key role on the offensive line.",
                    "Developed tactical understanding, physical discipline, and adaptability by learning an entirely new competitive structure.",
                  ],
                }}
              />
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center  rounded-full overflow-hidden p-1">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/aaas_logo.png"}
                        alt={"Águas Santas - Professional Team"}
                      />
                    </div>
                  ),
                  title: "Águas Santas (Senior Team)",
                  subtitle: "First Division Handball - Professional Stint",
                  date: { from: "Aug 2023", to: "May 2024" },
                  topics: [
                    "Briefly competed with Águas Santas' professional first-division roster, training and playing alongside top-tier national athletes in Portugal’s highest competitive level.",
                    "Strengthened professional discipline, match preparation habits, and tactical awareness while adapting to the physical and mental demands of elite senior-level handball.",
                  ],
                }}
              />
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center  rounded-full overflow-hidden p-px">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/fpa_logo.jpg"}
                        alt={"Portugal National Team"}
                      />
                    </div>
                  ),
                  title: "Portugal National Team (U19)",
                  subtitle: "Starting Goalkeeper - World Championship",
                  date: { from: "Jun 2023", to: "Aug 2023" },
                  topics: [
                    "Represented Portugal as the starting goalkeeper at the U19 World Championship, finishing 6th worldwide and achieving one of the best rankings in national history.",
                    "Learned to perform under international pressure, manage high-stakes competition, and work within elite multidisciplinary coaching environments.",
                  ],
                }}
              />
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden p-1">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/aaas_logo.png"}
                        alt={"Águas Santas"}
                      />
                    </div>
                  ),
                  title: "Águas Santas",
                  subtitle: "U18 / U20 Handball Goalkeeper",
                  date: { from: "Aug 2022", to: "Jun 2023" },
                  topics: [
                    "Competed at one of Portugal's top development clubs, improving technical performance and contributing to strong national-level results.",
                    "Gained high-performance training experience and learned to thrive in fast-paced, pressure-heavy environments.",
                  ],
                }}
              />
              <TimelineCard
                item={{
                  logo: (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-full overflow-hidden p-px">
                      <Image
                        className="w-full h-auto aspect-square object-contain"
                        width={64}
                        height={64}
                        src={"/assets/logos/logo_gcu.png"}
                        alt={"School Handball Team"}
                      />
                    </div>
                  ),
                  title: "School Handball Team",
                  subtitle: "Goalkeeper & Team Captain",
                  date: { from: "Nov 2018", to: "May 2022" },
                  topics: [
                    "Led the school team as goalkeeper and captain, helping secure strong regional placements and establishing the foundation for my competitive handball career.",
                    "Developed early leadership, resilience, and teamwork skills while balancing demanding training schedules with academic performance.",
                  ],
                }}
              />
            </Timeline>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
