import type { ChapterVersion, VersionSource } from "@/lib/types";
import {
  createChapterVersion,
  hashText,
  mutateDatabase,
  nowIso,
  readDatabase,
  refreshNovelWordCount
} from "@/server/data/database";
import { countWords } from "@/lib/word-count";

export async function listChapterVersions(chapterId: string) {
  const database = await readDatabase();

  return database.versions
    .filter((version) => version.chapterId === chapterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getVersion(versionId: string) {
  const database = await readDatabase();
  return database.versions.find((version) => version.id === versionId) ?? null;
}

export async function createVersionFromCurrentChapter(
  chapterId: string,
  source: VersionSource = "manual_save",
  sourceLabel?: string
) {
  return mutateDatabase((database) => {
    const chapter = database.chapters.find((item) => item.id === chapterId);

    if (!chapter) {
      return null;
    }

    return createChapterVersion({
      database,
      chapter,
      source,
      sourceLabel
    });
  });
}

export async function rollbackChapterToVersion(chapterId: string, versionId: string) {
  return mutateDatabase((database) => {
    const chapter = database.chapters.find((item) => item.id === chapterId);
    const target = database.versions.find(
      (version) => version.id === versionId && version.chapterId === chapterId
    );

    if (!chapter || !target) {
      return null;
    }

    chapter.title = target.title || chapter.title;
    chapter.content = target.content;
    chapter.wordCount = countWords(target.content);
    chapter.versionNo += 1;
    chapter.contentHash = hashText(target.content);
    chapter.updatedAt = nowIso();

    const rollbackVersion: ChapterVersion = createChapterVersion({
      database,
      chapter,
      source: "rollback",
      sourceLabel: `回滚到版本 ${target.versionNo}`,
      parentVersionId: target.id
    });

    refreshNovelWordCount(database, chapter.novelId);

    return {
      chapter: { ...chapter },
      version: rollbackVersion
    };
  });
}

