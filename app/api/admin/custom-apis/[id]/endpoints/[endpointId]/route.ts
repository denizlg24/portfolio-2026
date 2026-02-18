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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { endpointId } = await params;
        const body = await request.json();

        await connectDB();
        const endpoint = await CustomApiEndpoint.findByIdAndUpdate(
            endpointId,
            body,
            { new: true, runValidators: true }
        ).lean<LeanEndpoint>();

        if (!endpoint) {
            return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
        }

        return NextResponse.json(
            { message: "Endpoint updated successfully", endpoint: serializeEndpoint(endpoint) },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating endpoint:", error);
        return NextResponse.json({ error: "Failed to update endpoint" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { id, endpointId } = await params;
        await connectDB();

        const endpoint = await CustomApiEndpoint.findByIdAndDelete(endpointId);

        if (!endpoint) {
            return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
        }

        await CustomApi.findByIdAndUpdate(id, { $pull: { endpoints: endpointId } });

        return NextResponse.json({ message: "Endpoint deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting endpoint:", error);
        return NextResponse.json({ error: "Failed to delete endpoint" }, { status: 500 });
    }
}
