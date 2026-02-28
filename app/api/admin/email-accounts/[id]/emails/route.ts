import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { EmailModel } from "@/models/Email";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await connectDB();

    const emails = await EmailModel.find({ accountId: id })
      .sort({ date: -1 })
      .limit(100)
      .lean()
      .exec();

    return NextResponse.json(
      {
        emails: emails.map((email) => ({
          ...email,
          _id: email._id.toString(),
          accountId: String(email.accountId),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 },
    );
  }
}
