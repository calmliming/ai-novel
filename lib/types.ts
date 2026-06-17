export type NovelStatus = "draft" | "writing" | "completed" | "archived";

export type ChapterStatus = "draft" | "reviewing" | "finished";

export type VersionSource =
  | "manual_save"
  | "auto_save"
  | "ai_continue"
  | "ai_rewrite"
  | "ai_polish"
  | "ai_expand"
  | "ai_shorten"
  | "rollback"
  | "import";

export type AIWriteTask =
  | "continue"
  | "rewrite"
  | "polish"
  | "expand"
  | "shorten"
  | "generate-title"
  | "generate-outline"
  | "check-consistency";

export type AIModelMode = "fast" | "pro";

export type SyncStatus = "local" | "syncing" | "synced" | "conflict";

export type User = {
  id: string;
  email: string;
  name?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
};

export type Novel = {
  id: string;
  userId: string;
  title: string;
  genre?: string;
  style?: string;
  synopsis?: string;
  status: NovelStatus;
  totalWordCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Volume = {
  id: string;
  novelId: string;
  title: string;
  description?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type Chapter = {
  id: string;
  novelId: string;
  volumeId?: string;
  title: string;
  content: string;
  summary?: string;
  wordCount: number;
  orderIndex: number;
  status: ChapterStatus;
  versionNo: number;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type ChapterVersion = {
  id: string;
  novelId: string;
  chapterId: string;
  userId: string;
  title?: string;
  content: string;
  wordCount: number;
  versionNo: number;
  source: VersionSource;
  sourceLabel?: string;
  aiModel?: string;
  aiJobId?: string;
  promptSnapshot?: string;
  parentVersionId?: string;
  contentHash?: string;
  createdAt: string;
};

export type CharacterProfile = {
  id: string;
  novelId: string;
  name: string;
  alias?: string;
  role?: string;
  gender?: string;
  age?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  motivation?: string;
  speechStyle?: string;
  relationshipNotes?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type WorldSetting = {
  id: string;
  novelId: string;
  category: string;
  title: string;
  content: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
};

export type OutlineItem = {
  id: string;
  novelId: string;
  volumeId?: string;
  chapterId?: string;
  type: "book" | "volume" | "chapter" | "plot";
  title?: string;
  content: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type AIJob = {
  id: string;
  userId: string;
  novelId: string;
  chapterId?: string;
  task: AIWriteTask;
  status: "pending" | "running" | "succeeded" | "failed";
  model: string;
  inputMessages?: ChatMessage[];
  outputText?: string;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LocalDraft = {
  chapterId: string;
  novelId: string;
  title: string;
  content: string;
  baseVersionNo: number;
  updatedAt: string;
  syncedAt?: string;
  syncStatus: SyncStatus;
};

export type DiffBlock = {
  type: "same" | "added" | "removed" | "changed";
  oldText?: string;
  newText?: string;
  paragraphIndex?: number;
};

export type DiffResponse = {
  fromVersionId: string;
  toVersionId: string;
  blocks: DiffBlock[];
};

export type AIWriteRequest = {
  novelId: string;
  chapterId?: string;
  selectedText?: string;
  instruction?: string;
  targetWords?: number;
  modelMode?: AIModelMode;
};

export type AIWriteResponse = {
  jobId: string;
  content: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type NovelBundle = {
  novel: Novel;
  chapters: Chapter[];
  characters: CharacterProfile[];
  worldSettings: WorldSetting[];
  outlines: OutlineItem[];
  versions: ChapterVersion[];
};

