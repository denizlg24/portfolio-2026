import { type NextRequest, NextResponse } from "next/server";
import { pinata } from "@/lib/pinata";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 413 },
      );
    }

    const uploaded = await pinata.upload.public.file(file);
    const url = await pinata.gateways.public.convert(uploaded.cid);

    return NextResponse.json(
      {
        url,
        hash: uploaded.cid,
        id: uploaded.id,
        size: uploaded.size,
        name: uploaded.name,
        mimeType: uploaded.mime_type,
      },
      { status: 200 },
    );
  } catch (error) {
    const err = error as Error;
    console.error("Error uploading file:", err);
    return NextResponse.json(
      { error: "Failed to upload file", details: err.message },
      { status: 500 },
    );
  }
}
