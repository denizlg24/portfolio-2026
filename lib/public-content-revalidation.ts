import { revalidatePath } from "next/cache";

export function revalidateBlogContent() {
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
}

export function revalidateNowContent() {
  revalidatePath("/now");
}

export function revalidateProjectsContent() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/projects/[id]", "page");
}

export function revalidateTimelineContent() {
  revalidatePath("/");
}
