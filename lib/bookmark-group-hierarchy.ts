import type { ILeanBookmarkGroup } from "@/models/BookmarkGroup";

export type GroupLike = Pick<ILeanBookmarkGroup, "_id" | "parentId">;

export type AncestorMap = Map<string, Set<string>>;

export function buildAncestorMap(groups: GroupLike[]): AncestorMap {
  const parentById = new Map<string, string | null>();
  for (const g of groups) {
    const id = String(g._id);
    const parentId = g.parentId ? String(g.parentId) : null;
    parentById.set(id, parentId);
  }

  const memo: AncestorMap = new Map();

  const resolve = (id: string, seen: Set<string>): Set<string> => {
    const cached = memo.get(id);
    if (cached) return cached;
    if (seen.has(id)) return new Set();
    seen.add(id);

    const ancestors = new Set<string>();
    const parentId = parentById.get(id) ?? null;
    if (parentId && parentById.has(parentId)) {
      ancestors.add(parentId);
      for (const a of resolve(parentId, seen)) ancestors.add(a);
    }
    memo.set(id, ancestors);
    return ancestors;
  };

  for (const id of parentById.keys()) resolve(id, new Set());
  return memo;
}

export function pruneRedundantAncestors<T extends string | { toString(): string }>(
  groupIds: T[],
  ancestorMap: AncestorMap,
): T[] {
  if (groupIds.length < 2) return [...groupIds];

  const idSet = new Set(groupIds.map((g) => String(g)));
  const ancestorsOfAnyMember = new Set<string>();
  for (const id of idSet) {
    const ancestors = ancestorMap.get(id);
    if (!ancestors) continue;
    for (const a of ancestors) ancestorsOfAnyMember.add(a);
  }

  return groupIds.filter((g) => !ancestorsOfAnyMember.has(String(g)));
}

export function descendantIds(
  rootId: string,
  groups: GroupLike[],
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const g of groups) {
    const parentId = g.parentId ? String(g.parentId) : null;
    if (!parentId) continue;
    const list = childrenByParent.get(parentId) ?? [];
    list.push(String(g._id));
    childrenByParent.set(parentId, list);
  }

  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const children = childrenByParent.get(current) ?? [];
    for (const c of children) {
      if (!result.has(c)) {
        result.add(c);
        stack.push(c);
      }
    }
  }
  return result;
}
