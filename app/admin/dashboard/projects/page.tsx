import { getAdminSession } from "@/lib/require-admin";
import { redirect } from "next/navigation";
import { getAllProjects } from "@/lib/projects";
import { ProjectManager } from "./_components/project-manager";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FolderGit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default async function ProjectsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth/login");
  }

  const projects = await getAllProjects();
  if (!projects || projects.length === 0) {
    return (
      <div className="w-full flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div>
          <Empty>
            <EmptyHeader  className="max-w-lg!">
              <EmptyMedia variant="icon">
                <FolderGit2 className="w-12 h-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                You don't have any projects yet. Create a new one to get started displaying your projects.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/admin/dashboard/projects/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }
  return     <div className="max-w-7xl mx-auto space-y-6"><ProjectManager initialProjects={projects} /></div>;
}
