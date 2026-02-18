import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { CustomApi } from "@/models/CustomApi";
import { CustomApiEndpoint } from "@/models/CustomApiEndpoint";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        await connectDB();
        const api = await CustomApi.findById(id).lean();

        if (!api) {
            return NextResponse.json({ error: "Custom API not found" }, { status: 404 });
        }

        return NextResponse.json(
            { api: { ...api, _id: api._id.toString(), endpoints: (api.endpoints || []).map((e) => e.toString()) } },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching custom API:", error);
        return NextResponse.json({ error: "Failed to fetch custom API" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await request.json();

        await connectDB();
        const api = await CustomApi.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();

        if (!api) {
            return NextResponse.json({ error: "Custom API not found" }, { status: 404 });
        }

        return NextResponse.json(
            {
                message: "Custom API updated successfully",
                api: { ...api, _id: api._id.toString(), endpoints: (api.endpoints || []).map((e) => e.toString()) },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating custom API:", error);
        return NextResponse.json({ error: "Failed to update custom API" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        await connectDB();

        await CustomApiEndpoint.deleteMany({ apiId: id });
        const api = await CustomApi.findByIdAndDelete(id);

        if (!api) {
            return NextResponse.json({ error: "Custom API not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Custom API deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting custom API:", error);
        return NextResponse.json({ error: "Failed to delete custom API" }, { status: 500 });
    }
}
