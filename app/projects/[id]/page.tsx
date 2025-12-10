import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getActiveProjects, getProjectById } from "@/lib/projects";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const projects = await getActiveProjects();
 
  return projects.map((project) => ({
    id: project._id.toString(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) {
    return {
      title: "Project Not Found",
      description: "The requested project does not exist.",
    };
  }
  return {
    title: {
      absolute: `${project.title} | Deniz Lopes Güneş`,
    },
    description:
        project.subtitle,
    openGraph: {
      title: `${project.title} | Deniz Lopes Güneş`,
      description:
        project.subtitle,
      url: `https://denizlg24.com/projects/${project._id}`,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) {
    notFound();
  }
  return (
    <main className="flex flex-col items-center justify-center">
      <section className="w-full max-w-5xl mx-auto px-4 items-center mt-6">
        <h1 className="sm:text-4xl xs:text-3xl text-2xl font-calistoga text-balance text-center">
          {project.title}
        </h1>
        <div className="mt-6 flex items-center justify-center w-full h-auto aspect-video overflow-hidden rounded-lg drop-shadow-xl">
          <Image
            src={project.images[0]}
            alt={project.title}
            width={1920}
            height={1080}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex flex-col gap-0 mt-10 bg-surface/50 p-4 rounded">
          <Label className="">Project summary</Label>
          <Separator className="mt-2" />
          <h2 className="mt-2 sm:text-lg xs:text-base text-sm text-muted-foreground/75">
            {project.subtitle}
          </h2>
        </div>

        <Label className="mt-6 text-sm">Project description</Label>
        <Separator className="mt-2 -mb-8" />
        <MarkdownRenderer content={project.markdown} />
      </section>
    </main>
  );
}
