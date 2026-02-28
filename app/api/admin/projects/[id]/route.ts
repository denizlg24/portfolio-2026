import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getProjectById, toggleProjectActive } from "@/lib/projects";
import { requireAdmin } from "@/lib/require-admin";
import { Project } from "@/models/Project";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.toggleActive) {
      const project = await toggleProjectActive(id);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }
      revalidatePath("/", "layout");
      revalidatePath("/projects", "layout");
      revalidatePath(`/projects/${project._id.toString()}`, "layout");
      revalidatePath("/", "page");
      revalidatePath("/projects", "page");
      revalidatePath(`/projects/${project._id.toString()}`, "page");
      return NextResponse.json(
        { message: "Project visibility toggled successfully", project },
        { status: 200 },
      );
    }

    if (body.toggleFeatured) {
      await connectDB();
      const existingProject = await Project.findById(id).lean().exec();
      if (!existingProject) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }
      const project = await Project.findByIdAndUpdate(
        id,
        { isFeatured: !existingProject.isFeatured },
        { new: true, runValidators: true },
      )
        .lean()
        .exec();
      revalidatePath("/", "layout");
      revalidatePath("/projects", "layout");
      revalidatePath(`/projects/${project?._id.toString()}`, "layout");
      revalidatePath("/", "page");
      revalidatePath("/projects", "page");
      revalidatePath(`/projects/${project?._id.toString()}`, "page");
      return NextResponse.json(
        { message: "Project featured status toggled successfully", project },
        { status: 200 },
      );
    }

    await connectDB();
    const project = await Project.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    revalidatePath("/", "layout");
    revalidatePath("/projects", "layout");
    revalidatePath(`/projects/${project._id.toString()}`, "layout");
    revalidatePath("/", "page");
    revalidatePath("/projects", "page");
    revalidatePath(`/projects/${project._id.toString()}`, "page");
    return NextResponse.json(
      {
        message: "Project updated successfully",
        project: {
          ...project,
          _id: project._id.toString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await connectDB();
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    revalidatePath("/", "layout");
    revalidatePath("/projects", "layout");
    revalidatePath(`/projects/${project._id.toString()}`, "layout");
    revalidatePath("/", "page");
    revalidatePath("/projects", "page");
    revalidatePath(`/projects/${project._id.toString()}`, "page");
    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
