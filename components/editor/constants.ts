import { Maximize2, Minimize2, PenLine, Sparkles, Wand2 } from "lucide-react";
import type { AIWriteTask, NovelBundle, SyncStatus, VersionSource } from "@/lib/types";

export const sourceByTask: Partial<Record<AIWriteTask, VersionSource>> = {
  continue: "ai_continue",
  rewrite: "ai_rewrite",
  polish: "ai_polish",
  expand: "ai_expand",
  shorten: "ai_shorten"
};

export const aiActions: Array<{
  task: AIWriteTask;
  label: string;
  icon: typeof Sparkles;
}> = [
  { task: "continue", label: "续写", icon: Sparkles },
  { task: "polish", label: "润色", icon: Wand2 },
  { task: "rewrite", label: "改写", icon: PenLine },
  { task: "expand", label: "扩写", icon: Maximize2 },
  { task: "shorten", label: "缩写", icon: Minimize2 }
];

export function syncText(status: SyncStatus) {
  const labels: Record<SyncStatus, string> = {
    local: "本地草稿",
    syncing: "同步中",
    synced: "自动保存成功",
    conflict: "有冲突"
  };

  return labels[status];
}

export function buildSmartTags(bundle: NovelBundle | null, chapterTitle: string) {
  const seeds = [
    bundle?.novel.genre,
    bundle?.novel.style?.split(/[、,，\s]+/)[0],
    chapterTitle.replace(/^第.+?章\s*/, "").split(/\s+/)[0],
    bundle?.characters[0]?.name,
    bundle?.worldSettings[0]?.category
  ].filter(Boolean) as string[];

  return Array.from(new Set([...seeds, "续写", "伏笔"])).slice(0, 6);
}
