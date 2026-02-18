import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { CustomApi } from "@/models/CustomApi";
import { CustomApiEndpoint } from "@/models/CustomApiEndpoint";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { id, endpointId } = await params;
        const { headers: headerValues = {}, body: bodyValues = {} } = await request.json();

        await connectDB();
        const [api, endpoint] = await Promise.all([
            CustomApi.findById(id).lean(),
            CustomApiEndpoint.findById(endpointId).lean(),
        ]);

        if (!api) return NextResponse.json({ error: "Custom API not found" }, { status: 404 });
        if (!endpoint) return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });

        const url = `${api.baseUrl}${endpoint.path}`;
        const fetchOptions: RequestInit = {
            method: endpoint.method,
            headers: {
                "Content-Type": "application/json",
                ...headerValues,
            },
        };

        if (!["GET", "DELETE"].includes(endpoint.method) && Object.keys(bodyValues).length > 0) {
            fetchOptions.body = JSON.stringify(bodyValues);
        }

        const startTime = Date.now();
        const response = await fetch(url, fetchOptions);
        const duration = Date.now() - startTime;

        const contentType = response.headers.get("content-type") ?? "";
        let responseBody: unknown;
        try {
            responseBody = contentType.includes("application/json")
                ? await response.json()
                : await response.text();
        } catch {
            responseBody = await response.text();
        }

        return NextResponse.json(
            { status: response.status, statusText: response.statusText, duration, body: responseBody },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error calling endpoint:", error);
        return NextResponse.json({ error: "Failed to call endpoint", details: String(error) }, { status: 500 });
    }
}
