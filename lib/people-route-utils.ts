import mongoose from "mongoose";
import {
  buildAncestorMap,
  pruneRedundantAncestors,
} from "@/lib/note-group-hierarchy";
import type { ILeanPerson } from "@/models/Person";
import type { ILeanPersonEdge } from "@/models/PersonEdge";
import { type ILeanPersonGroup, PersonGroup } from "@/models/PersonGroup";

export function serializePerson(person: ILeanPerson) {
  return {
    ...person,
    _id: String(person._id),
    groupIds: (person.groupIds ?? []).map(String),
  };
}

export function serializePersonGroup(group: ILeanPersonGroup) {
  return {
    ...group,
    _id: String(group._id),
    parentId: group.parentId ? String(group.parentId) : null,
  };
}

export function serializePersonEdge(edge: ILeanPersonEdge) {
  return {
    ...edge,
    _id: String(edge._id),
    from: String(edge.from),
    to: String(edge.to),
  };
}

export async function prunePersonGroupIds(groupIds: string[]) {
  const deduped = [
    ...new Set(
      groupIds.filter(
        (groupId) =>
          typeof groupId === "string" &&
          mongoose.Types.ObjectId.isValid(groupId),
      ),
    ),
  ];

  if (deduped.length < 2) {
    return deduped.map((groupId) => new mongoose.Types.ObjectId(groupId));
  }

  const groups = await PersonGroup.find()
    .select("_id parentId")
    .lean<
      Array<{
        _id: mongoose.Types.ObjectId;
        parentId?: mongoose.Types.ObjectId | null;
      }>
    >()
    .exec();

  const ancestorMap = buildAncestorMap(
    groups.map((group) => ({
      _id: String(group._id),
      parentId: group.parentId ? String(group.parentId) : null,
    })),
  );

  return pruneRedundantAncestors(deduped, ancestorMap).map(
    (groupId) => new mongoose.Types.ObjectId(groupId),
  );
}

export function canonicalPersonPair(left: string, right: string) {
  return left < right ? [left, right] : [right, left];
}
