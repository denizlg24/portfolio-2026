import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/require-admin";
import { connectDB } from "@/lib/mongodb";
import { Resource } from "@/models/Resource";
import { ResourcesManager, type LeanResource } from "./_components/resources-manager";

export default async function ResourcesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/auth/login");

  await connectDB();
  const raw = await Resource.find().sort({ createdAt: -1 }).lean();

  const resources: LeanResource[] = raw.map((r) => ({
    _id: r._id.toString(),
    name: r.name,
    description: r.description,
    url: r.url,
    type: r.type,
    isActive: r.isActive,
    healthCheck: r.healthCheck,
    capabilities: r.capabilities.map((c) => ({
      _id: c._id.toString(),
      type: c.type,
      label: c.label,
      config: c.config,
      isActive: c.isActive,
    })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <>
      <div className="flex flex-col items-start gap-1 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Resources</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your infrastructure, services, and their capabilities.
        </p>
      </div>
      <ResourcesManager initialResources={resources} />
    </>
  );
}
