import { getProjectTags } from "@/lib/projects";
import { FilterBar } from "./filter-bar";

export async function FilterWrapper() {
  const tags = await getProjectTags();
  return <FilterBar tags={tags} />;
}
