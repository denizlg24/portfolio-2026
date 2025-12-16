import { type NextRequest, NextResponse } from "next/server";
import { pinata } from "@/lib/pinata";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { cid } = await pinata.upload.public.file(file);
    const url = await pinata.gateways.public.convert(cid);

    return NextResponse.json({ url, hash: cid }, { status: 200 });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 },
    );
  }
}
