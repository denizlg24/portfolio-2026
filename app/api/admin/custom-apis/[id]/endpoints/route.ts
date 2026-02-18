import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { CustomApi } from "@/models/CustomApi";
import { CustomApiEndpoint, type BodyFieldType } from "@/models/CustomApiEndpoint";

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

function serializeEndpoint(ep: LeanEndpoint) {
    return { ...ep, _id: ep._id.toString(), apiId: ep.apiId.toString() };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        await connectDB();
        const endpoints = await CustomApiEndpoint.find({ apiId: id }).lean<LeanEndpoint[]>();
        return NextResponse.json({ endpoints: endpoints.map(serializeEndpoint) }, { status: 200 });
    } catch (error) {
        console.error("Error fetching endpoints:", error);
        return NextResponse.json({ error: "Failed to fetch endpoints" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, path, method, headers, description, isActive, body: endpointBody } = body;

        await connectDB();
        const endpoint = await CustomApiEndpoint.create({
            apiId: id,
            name,
            path,
            method,
            headers: headers ?? {},
            body: endpointBody ?? {},
            description,
            isActive: isActive !== undefined ? isActive : true,
        });

        await CustomApi.findByIdAndUpdate(id, { $push: { endpoints: endpoint._id } });

        const lean = await CustomApiEndpoint.findById(endpoint._id).lean<LeanEndpoint>();
        return NextResponse.json(
            { message: "Endpoint created successfully", endpoint: serializeEndpoint(lean!) },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating endpoint:", error);
        return NextResponse.json({ error: "Failed to create endpoint" }, { status: 500 });
    }
}
