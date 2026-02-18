import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/require-admin";
import { connectDB } from "@/lib/mongodb";
import { CustomApi } from "@/models/CustomApi";
import { CustomApiEndpoint, type BodyFieldType } from "@/models/CustomApiEndpoint";
import { CronJobsManager, type ApiWithEndpoints } from "./_components/cron-jobs-manager";

type LeanEndpoint = {
  _id: mongoose.Types.ObjectId;
  apiId: mongoose.Types.ObjectId;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers: Record<string, string>;
  body: Record<string, BodyFieldType>;
  name: string;
  description: string;
  isActive: boolean;
};

type LeanApi = {
  _id: mongoose.Types.ObjectId;
  name: string;
  baseUrl: string;
  description: string;
  isActive: boolean;
  apiType: string;
  endpoints: LeanEndpoint[];
};

export default async function CronJobsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/auth/login");

  await connectDB();

  const apisRaw = await CustomApi.find()
    .populate<{ endpoints: LeanEndpoint[] }>("endpoints")
    .lean<LeanApi[]>();

  const apis: ApiWithEndpoints[] = apisRaw.map((api) => ({
    _id: api._id.toString(),
    name: api.name,
    baseUrl: api.baseUrl,
    description: api.description,
    isActive: api.isActive,
    apiType: api.apiType ?? "generic",
    endpoints: (api.endpoints ?? []).map((ep) => ({
      _id: ep._id.toString(),
      apiId: ep.apiId.toString(),
      path: ep.path,
      method: ep.method,
      headers: ep.headers ?? {},
      body: ep.body ?? {},
      name: ep.name,
      description: ep.description,
      isActive: ep.isActive,
    })),
  }));

  return (
    <>
      <div className="flex flex-col items-start gap-1 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Cron Jobs</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Monitor and manage your PiCron scheduler and external APIs.
        </p>
      </div>
      <CronJobsManager initialApis={apis} />
    </>
  );
}
