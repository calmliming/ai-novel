"use client";

import Link from "next/link";
import { ArrowLeft, History, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SyncStatus } from "@/lib/types";

export function EditorHeader({
  novelId,
  chapterId,
  title,
  onTitleChange,
  onManualSave,
  saving,
  syncStatus,
  wordCount
}: {
  novelId: string;
  chapterId: string;
  title: string;
  onTitleChange: (title: string) => void;
  onManualSave: () => void;
  saving: boolean;
  syncStatus: SyncStatus;
  wordCount: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-paper/95 px-3 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[40px_1fr_auto] items-center gap-2">
        <Link
          href={`/novels/${novelId}`}
          className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-white text-ink shadow-sm"
          aria-label="返回作品"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="h-10 border-transparent bg-white/70 font-semibold"
            placeholder="章节标题"
          />
          <p className="mt-1 truncate px-1 text-xs text-black/50">
            {wordCount} 字 · {syncText(syncStatus)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/novels/${novelId}/chapters/${chapterId}/history`}
            className="focus-ring grid h-10 w-10 place-items-center rounded-md bg-white text-ink shadow-sm"
            aria-label="历史版本"
          >
            <History className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Button size="icon" onClick={onManualSave} disabled={saving} aria-label="手动保存">
            <Save className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function syncText(status: SyncStatus) {
  const labels: Record<SyncStatus, string> = {
    local: "本地草稿",
    syncing: "同步中",
    synced: "已同步",
    conflict: "有冲突"
  };

  return labels[status];
}

