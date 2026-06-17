import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AIJob,
  CharacterProfile,
  Chapter,
  ChapterVersion,
  Novel,
  OutlineItem,
  User,
  Volume,
  WorldSetting
} from "@/lib/types";
import { countWords } from "@/lib/word-count";

export const DEFAULT_USER_ID = "local-user";

export type AppDatabase = {
  users: User[];
  novels: Novel[];
  volumes: Volume[];
  chapters: Chapter[];
  versions: ChapterVersion[];
  characters: CharacterProfile[];
  worldSettings: WorldSetting[];
  outlines: OutlineItem[];
  aiJobs: AIJob[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

export function nowIso() {
  return new Date().toISOString();
}

export function createId() {
  return randomUUID();
}

export function hashText(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export async function readDatabase(): Promise<AppDatabase> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as AppDatabase;
  } catch {
    const seeded = createSeedDatabase();
    await writeDatabase(seeded);
    return seeded;
  }
}

export async function writeDatabase(database: AppDatabase) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(database, null, 2), "utf8");
}

export async function mutateDatabase<T>(
  mutator: (database: AppDatabase) => T | Promise<T>
) {
  const database = await readDatabase();
  const result = await mutator(database);
  await writeDatabase(database);
  return result;
}

export function refreshNovelWordCount(database: AppDatabase, novelId: string) {
  const totalWordCount = database.chapters
    .filter((chapter) => chapter.novelId === novelId)
    .reduce((total, chapter) => total + chapter.wordCount, 0);

  const novel = database.novels.find((item) => item.id === novelId);

  if (novel) {
    novel.totalWordCount = totalWordCount;
    novel.updatedAt = nowIso();
  }
}

export function createChapterVersion(params: {
  database: AppDatabase;
  chapter: Chapter;
  userId?: string;
  source: ChapterVersion["source"];
  sourceLabel?: string;
  aiModel?: string;
  aiJobId?: string;
  promptSnapshot?: string;
  parentVersionId?: string;
}) {
  const version: ChapterVersion = {
    id: createId(),
    novelId: params.chapter.novelId,
    chapterId: params.chapter.id,
    userId: params.userId ?? DEFAULT_USER_ID,
    title: params.chapter.title,
    content: params.chapter.content,
    wordCount: params.chapter.wordCount,
    versionNo: params.chapter.versionNo,
    source: params.source,
    sourceLabel: params.sourceLabel,
    aiModel: params.aiModel,
    aiJobId: params.aiJobId,
    promptSnapshot: params.promptSnapshot,
    parentVersionId: params.parentVersionId,
    contentHash: params.chapter.contentHash,
    createdAt: nowIso()
  };

  params.database.versions.unshift(version);
  return version;
}

function createSeedDatabase(): AppDatabase {
  const createdAt = nowIso();
  const user: User = {
    id: DEFAULT_USER_ID,
    email: "writer@example.local",
    name: "本地作者",
    createdAt,
    updatedAt: createdAt
  };

  const novelId = createId();
  const chapterId = createId();
  const content =
    "雨停在凌晨四点。林青把窗推开时，整座旧城像一页刚刚晾干的纸，墨色还未完全褪去。\n\n她摸到口袋里的铜钥匙，钥匙齿纹间夹着一粒细小的银砂。那是母亲失踪前留下的最后线索，也是她回到雾港的唯一理由。";
  const chapter: Chapter = {
    id: chapterId,
    novelId,
    title: "第一章 雾港来信",
    content,
    summary: "林青回到雾港，发现母亲留下的钥匙藏有异常银砂。",
    wordCount: countWords(content),
    orderIndex: 0,
    status: "draft",
    versionNo: 1,
    contentHash: hashText(content),
    createdAt,
    updatedAt: createdAt
  };

  const novel: Novel = {
    id: novelId,
    userId: user.id,
    title: "雾港银钥",
    genre: "悬疑奇幻",
    style: "冷静、细腻、带有城市传说质感",
    synopsis: "一名年轻修复师回到故乡雾港，追查母亲失踪与古老银钥组织之间的秘密。",
    status: "writing",
    totalWordCount: chapter.wordCount,
    createdAt,
    updatedAt: createdAt
  };

  const version: ChapterVersion = {
    id: createId(),
    novelId,
    chapterId,
    userId: user.id,
    title: chapter.title,
    content,
    wordCount: chapter.wordCount,
    versionNo: 1,
    source: "import",
    sourceLabel: "示例初稿",
    contentHash: chapter.contentHash,
    createdAt
  };

  return {
    users: [user],
    novels: [novel],
    volumes: [],
    chapters: [chapter],
    versions: [version],
    characters: [
      {
        id: createId(),
        novelId,
        name: "林青",
        role: "主角",
        age: "26",
        appearance: "黑短发，常穿深色风衣",
        personality: "冷静、敏感，对细节有近乎固执的耐心",
        background: "古籍修复师，母亲失踪后离开雾港多年",
        motivation: "找到母亲失踪真相",
        speechStyle: "短句多，很少解释自己的情绪",
        relationshipNotes: "与雾港旧警署顾问沈砚互相试探",
        status: "active",
        createdAt,
        updatedAt: createdAt
      }
    ],
    worldSettings: [
      {
        id: createId(),
        novelId,
        category: "城市",
        title: "雾港",
        content: "一座常年潮湿多雾的港口旧城。传说每逢银潮夜，失物会沿着地下水道回到主人身边。",
        importance: 5,
        createdAt,
        updatedAt: createdAt
      }
    ],
    outlines: [
      {
        id: createId(),
        novelId,
        type: "book",
        title: "主线",
        content: "林青追查银钥来源，逐步发现母亲并非受害者，而是守护雾港秘密的人。",
        orderIndex: 0,
        createdAt,
        updatedAt: createdAt
      }
    ],
    aiJobs: []
  };
}
