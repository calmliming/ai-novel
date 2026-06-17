import { createParagraphDiff } from "@/lib/diff";
import type { DiffResponse } from "@/lib/types";
import { readDatabase } from "@/server/data/database";

export async function diffVersions(
  fromVersionId: string,
  toVersionId: string
): Promise<DiffResponse | null> {
  const database = await readDatabase();
  const fromVersion = database.versions.find((version) => version.id === fromVersionId);
  const toVersion = database.versions.find((version) => version.id === toVersionId);

  if (!fromVersion || !toVersion) {
    return null;
  }

  return {
    fromVersionId,
    toVersionId,
    blocks: createParagraphDiff(fromVersion.content, toVersion.content)
  };
}

