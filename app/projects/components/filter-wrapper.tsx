import { getProjectTags } from "@/lib/projects";
import { FilterBar } from "./filter-bar";

export async function FilterWrapper({
  fetcher = "projects",
}: {
  fetcher?: "projects" | "blog";
}) {
  const tags = fetcher == "projects" ? await getProjectTags() : [];
  return <FilterBar related={fetcher} tags={tags} />;
}
