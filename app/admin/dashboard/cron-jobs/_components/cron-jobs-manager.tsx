"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ILeanCustomApiEndpoint } from "@/models/CustomApiEndpoint";
import { CreateApiDialog } from "./create-api-dialog";
import { CustomApiCard } from "./custom-api-card";
import { PiCronDashboard } from "./picron-dashboard";

export interface ApiWithEndpoints {
  _id: string;
  name: string;
  baseUrl: string;
  description: string;
  isActive: boolean;
  apiType: string;
  endpoints: ILeanCustomApiEndpoint[];
}

interface CronJobsManagerProps {
  initialApis: ApiWithEndpoints[];
}

export function CronJobsManager({ initialApis }: CronJobsManagerProps) {
  const [apis, setApis] = useState<ApiWithEndpoints[]>(initialApis);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchApis = async () => {
    try {
      const res = await fetch("/api/admin/custom-apis", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      const apisWithEndpoints: ApiWithEndpoints[] = await Promise.all(
        data.apis.map(async (api: ApiWithEndpoints) => {
          const epRes = await fetch(
            `/api/admin/custom-apis/${api._id}/endpoints`,
            { cache: "no-store" },
          );
          const epData = epRes.ok ? await epRes.json() : { endpoints: [] };
          return { ...api, endpoints: epData.endpoints };
        }),
      );

      setApis(apisWithEndpoints);
    } catch (error) {
      console.error("Error fetching APIs:", error);
    }
  };

  const piCronApis = apis.filter((a) => a.apiType === "picron");
  const genericApis = apis.filter((a) => a.apiType !== "picron");

  return (
    <div className="space-y-8 pb-8">
      {piCronApis.map((api) => (
        <PiCronDashboard
          key={api._id}
          apiId={api._id}
          name={api.name}
          baseUrl={api.baseUrl}
        />
      ))}

      {apis.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No connections configured</p>
          <p className="text-sm mb-4">
            Add a PiCron instance or a generic API to get started.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      )}

      {genericApis.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Generic APIs
          </h2>
          <div className="space-y-4">
            {genericApis.map((api) => (
              <CustomApiCard key={api._id} api={api} onRefresh={fetchApis} />
            ))}
          </div>
        </div>
      )}

      {apis.length > 0 && (
        <div className="flex justify-start pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Connection
          </Button>
        </div>
      )}

      <CreateApiDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchApis}
      />
    </div>
  );
}
