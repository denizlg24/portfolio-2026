import { connectDB } from './mongodb';
import { Resource, type IResource } from '@/models/Resource';

export interface HealthCheckResult {
  resourceId: string;
  name: string;
  url: string;
  status: number | null;
  responseTimeMs: number | null;
  isHealthy: boolean;
  error?: string;
}

export async function checkResourceHealth(resource: IResource): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(resource.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);
    const responseTimeMs = Date.now() - start;
    const isHealthy = res.status === resource.healthCheck.expectedStatus;

    return {
      resourceId: resource._id.toString(),
      name: resource.name,
      url: resource.url,
      status: res.status,
      responseTimeMs,
      isHealthy,
    };
  } catch (err) {
    return {
      resourceId: resource._id.toString(),
      name: resource.name,
      url: resource.url,
      status: null,
      responseTimeMs: Date.now() - start,
      isHealthy: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
  await connectDB();

  const resources = await Resource.find({
    isActive: true,
    'healthCheck.enabled': true,
  });

  const results: HealthCheckResult[] = [];

  for (const resource of resources) {
    const result = await checkResourceHealth(resource);

    await Resource.updateOne(
      { _id: resource._id },
      {
        $set: {
          'healthCheck.lastCheckedAt': new Date(),
          'healthCheck.lastStatus': result.status,
          'healthCheck.lastResponseTimeMs': result.responseTimeMs,
          'healthCheck.isHealthy': result.isHealthy,
        },
      },
    );

    results.push(result);
  }

  return results;
}
