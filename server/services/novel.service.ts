import type { Novel, NovelBundle, NovelStatus } from "@/lib/types";
import {
  DEFAULT_USER_ID,
  createId,
  mutateDatabase,
  nowIso,
  readDatabase
} from "@/server/data/database";

export type NovelCreateInput = {
  title: string;
  genre?: string;
  style?: string;
  synopsis?: string;
  status?: NovelStatus;
};

export type NovelUpdateInput = Partial<NovelCreateInput>;

export async function listNovels() {
  const database = await readDatabase();
  const latestChapterByNovelId = new Map<string, (typeof database.chapters)[number]>();

  for (const chapter of database.chapters) {
    const latestChapter = latestChapterByNovelId.get(chapter.novelId);

    if (!latestChapter || chapter.updatedAt > latestChapter.updatedAt) {
      latestChapterByNovelId.set(chapter.novelId, chapter);
    }
  }

  return database.novels
    .map((novel) => ({
      ...novel,
      latestChapter: latestChapterByNovelId.get(novel.id)
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createNovel(input: NovelCreateInput) {
  return mutateDatabase((database) => {
    const timestamp = nowIso();
    const novel: Novel = {
      id: createId(),
      userId: DEFAULT_USER_ID,
      title: input.title.trim(),
      genre: input.genre?.trim(),
      style: input.style?.trim(),
      synopsis: input.synopsis?.trim(),
      status: input.status ?? "writing",
      totalWordCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.novels.unshift(novel);
    return novel;
  });
}

export async function getNovel(novelId: string) {
  const database = await readDatabase();
  const novel = database.novels.find((item) => item.id === novelId);

  if (!novel) {
    return null;
  }

  const chapters = database.chapters
    .filter((chapter) => chapter.novelId === novelId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const totalWordCount = chapters.reduce((total, chapter) => total + chapter.wordCount, 0);

  return {
    novel: {
      ...novel,
      totalWordCount
    },
    chapters,
    characters: database.characters
      .filter((character) => character.novelId === novelId)
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN")),
    worldSettings: database.worldSettings
      .filter((setting) => setting.novelId === novelId)
      .sort((a, b) => b.importance - a.importance),
    outlines: database.outlines
      .filter((outline) => outline.novelId === novelId)
      .sort((a, b) => a.orderIndex - b.orderIndex),
    versions: database.versions
      .filter((version) => version.novelId === novelId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } satisfies NovelBundle;
}

export async function updateNovel(novelId: string, input: NovelUpdateInput) {
  return mutateDatabase((database) => {
    const novel = database.novels.find((item) => item.id === novelId);

    if (!novel) {
      return null;
    }

    if (input.title !== undefined) {
      novel.title = input.title.trim();
    }

    if (input.genre !== undefined) {
      novel.genre = input.genre.trim();
    }

    if (input.style !== undefined) {
      novel.style = input.style.trim();
    }

    if (input.synopsis !== undefined) {
      novel.synopsis = input.synopsis.trim();
    }

    if (input.status !== undefined) {
      novel.status = input.status;
    }

    novel.updatedAt = nowIso();
    return novel;
  });
}

export async function deleteNovel(novelId: string) {
  return mutateDatabase((database) => {
    const exists = database.novels.some((novel) => novel.id === novelId);

    if (!exists) {
      return false;
    }

    database.novels = database.novels.filter((novel) => novel.id !== novelId);
    database.volumes = database.volumes.filter((volume) => volume.novelId !== novelId);
    database.chapters = database.chapters.filter((chapter) => chapter.novelId !== novelId);
    database.versions = database.versions.filter((version) => version.novelId !== novelId);
    database.characters = database.characters.filter((character) => character.novelId !== novelId);
    database.worldSettings = database.worldSettings.filter((setting) => setting.novelId !== novelId);
    database.outlines = database.outlines.filter((outline) => outline.novelId !== novelId);
    database.aiJobs = database.aiJobs.filter((job) => job.novelId !== novelId);

    return true;
  });
}

export async function exportNovelBundle(novelId: string) {
  return getNovel(novelId);
}
