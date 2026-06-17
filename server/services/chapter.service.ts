import type { Chapter, ChapterVersion, VersionSource } from "@/lib/types";
import { countWords } from "@/lib/word-count";
import {
  DEFAULT_USER_ID,
  createChapterVersion,
  createId,
  hashText,
  mutateDatabase,
  nowIso,
  readDatabase,
  refreshNovelWordCount
} from "@/server/data/database";

export type ChapterCreateInput = {
  title: string;
  content?: string;
  summary?: string;
  volumeId?: string;
};

export type ChapterUpdateInput = {
  title?: string;
  content?: string;
  summary?: string;
  status?: Chapter["status"];
  baseVersionNo: number;
  createVersion?: boolean;
  versionSource?: VersionSource;
  sourceLabel?: string;
  aiModel?: string;
  aiJobId?: string;
  promptSnapshot?: string;
  force?: boolean;
};

export type ChapterUpdateResult =
  | {
      status: "ok";
      chapter: Chapter;
      version?: ChapterVersion;
      changed: boolean;
    }
  | {
      status: "conflict";
      serverChapter: Chapter;
    };

export async function listChapters(novelId: string) {
  const database = await readDatabase();

  return database.chapters
    .filter((chapter) => chapter.novelId === novelId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function createChapter(novelId: string, input: ChapterCreateInput) {
  return mutateDatabase((database) => {
    const novel = database.novels.find((item) => item.id === novelId);

    if (!novel) {
      return null;
    }

    const timestamp = nowIso();
    const content = input.content ?? "";
    const chapter: Chapter = {
      id: createId(),
      novelId,
      volumeId: input.volumeId,
      title: input.title.trim() || "未命名章节",
      content,
      summary: input.summary?.trim(),
      wordCount: countWords(content),
      orderIndex:
        Math.max(
          -1,
          ...database.chapters
            .filter((item) => item.novelId === novelId)
            .map((item) => item.orderIndex)
        ) + 1,
      status: "draft",
      versionNo: 1,
      contentHash: hashText(content),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.chapters.push(chapter);
    createChapterVersion({
      database,
      chapter,
      source: "manual_save",
      sourceLabel: "创建章节"
    });
    refreshNovelWordCount(database, novelId);
    return chapter;
  });
}

export async function getChapter(chapterId: string) {
  const database = await readDatabase();
  return database.chapters.find((chapter) => chapter.id === chapterId) ?? null;
}

export async function updateChapter(
  chapterId: string,
  input: ChapterUpdateInput
): Promise<ChapterUpdateResult | null> {
  return mutateDatabase((database) => {
    const chapter = database.chapters.find((item) => item.id === chapterId);

    if (!chapter) {
      return null;
    }

    if (!input.force && input.baseVersionNo !== chapter.versionNo) {
      return {
        status: "conflict",
        serverChapter: { ...chapter }
      };
    }

    const nextTitle = input.title !== undefined ? input.title.trim() : chapter.title;
    const nextContent = input.content !== undefined ? input.content : chapter.content;
    const nextSummary = input.summary !== undefined ? input.summary.trim() : chapter.summary;
    const nextStatus = input.status ?? chapter.status;
    const changed =
      nextTitle !== chapter.title ||
      nextContent !== chapter.content ||
      nextSummary !== chapter.summary ||
      nextStatus !== chapter.status;

    if (!changed) {
      return {
        status: "ok",
        chapter: { ...chapter },
        changed: false
      };
    }

    chapter.title = nextTitle || "未命名章节";
    chapter.content = nextContent;
    chapter.summary = nextSummary;
    chapter.status = nextStatus;
    chapter.wordCount = countWords(nextContent);
    chapter.versionNo += 1;
    chapter.contentHash = hashText(nextContent);
    chapter.updatedAt = nowIso();

    const source = input.versionSource ?? "auto_save";
    const shouldCreateVersion =
      input.createVersion === true ||
      (source === "auto_save" && shouldCreateAutoVersion(database.versions, chapter));

    const version = shouldCreateVersion
      ? createChapterVersion({
          database,
          chapter,
          userId: DEFAULT_USER_ID,
          source,
          sourceLabel: input.sourceLabel,
          aiModel: input.aiModel,
          aiJobId: input.aiJobId,
          promptSnapshot: input.promptSnapshot
        })
      : undefined;

    refreshNovelWordCount(database, chapter.novelId);

    return {
      status: "ok",
      chapter: { ...chapter },
      version,
      changed: true
    };
  });
}

export async function deleteChapter(chapterId: string) {
  return mutateDatabase((database) => {
    const chapter = database.chapters.find((item) => item.id === chapterId);

    if (!chapter) {
      return false;
    }

    database.chapters = database.chapters.filter((item) => item.id !== chapterId);
    database.versions = database.versions.filter((version) => version.chapterId !== chapterId);
    database.aiJobs = database.aiJobs.filter((job) => job.chapterId !== chapterId);

    const siblings = database.chapters
      .filter((item) => item.novelId === chapter.novelId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    siblings.forEach((item, index) => {
      item.orderIndex = index;
    });

    refreshNovelWordCount(database, chapter.novelId);
    return true;
  });
}

export async function reorderChapters(novelId: string, orderedIds: string[]) {
  return mutateDatabase((database) => {
    const chapters = database.chapters.filter((chapter) => chapter.novelId === novelId);
    const chapterIds = new Set(chapters.map((chapter) => chapter.id));

    if (orderedIds.some((id) => !chapterIds.has(id))) {
      return null;
    }

    for (const chapter of chapters) {
      const nextIndex = orderedIds.indexOf(chapter.id);

      if (nextIndex >= 0) {
        chapter.orderIndex = nextIndex;
        chapter.updatedAt = nowIso();
      }
    }

    return chapters.sort((a, b) => a.orderIndex - b.orderIndex);
  });
}

function shouldCreateAutoVersion(versions: ChapterVersion[], chapter: Chapter) {
  const latestAuto = versions
    .filter((version) => version.chapterId === chapter.id && version.source === "auto_save")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!latestAuto) {
    return chapter.wordCount >= 20;
  }

  const elapsedMs = Date.now() - new Date(latestAuto.createdAt).getTime();
  const wordDelta = Math.abs(chapter.wordCount - latestAuto.wordCount);

  return elapsedMs >= 60_000 && wordDelta >= 20;
}

