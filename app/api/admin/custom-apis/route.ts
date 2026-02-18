import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { CustomApi } from "@/models/CustomApi";

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        await connectDB();
        const apis = await CustomApi.find().lean();
        const serialized = apis.map((api) => ({
            ...api,
            _id: api._id.toString(),
            endpoints: (api.endpoints || []).map((id) => id.toString()),
        }));
        return NextResponse.json({ apis: serialized }, { status: 200 });
    } catch (error) {
        console.error("Error fetching custom APIs:", error);
        return NextResponse.json({ error: "Failed to fetch custom APIs" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, baseUrl, description, isActive, apiType } = body;

        await connectDB();
        const api = await CustomApi.create({
            name,
            baseUrl,
            description,
            isActive: isActive !== undefined ? isActive : true,
            apiType: apiType ?? "generic",
            endpoints: [],
        });

        return NextResponse.json(
            {
                message: "Custom API created successfully",
                api: { ...api.toObject(), _id: api._id.toString(), endpoints: [] },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating custom API:", error);
        return NextResponse.json({ error: "Failed to create custom API" }, { status: 500 });
    }
}
