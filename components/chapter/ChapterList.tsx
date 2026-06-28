"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, FilePenLine, Trash2 } from "lucide-react";
import type { Chapter } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";
import { formatDateTime } from "@/lib/utils";

export function ChapterList({
  novelId,
  chapters,
  onDelete,
  onMove
}: {
  novelId: string;
  chapters: Chapter[];
  onDelete: (chapterId: string) => void;
  onMove: (chapterId: string, direction: "up" | "down") => void;
}) {
  if (!chapters.length) {
    return <EmptyState title="还没有章节" description="新建第一章后就可以开始正文写作。" />;
  }

  return (
    <div className="grid gap-3">
      {chapters.map((chapter, index) => (
        <Surface key={chapter.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <Link
              href={`/novels/${novelId}/chapters/${chapter.id}`}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-base font-semibold text-ink">{chapter.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-black/55 sm:block sm:truncate">
                {chapter.wordCount} 字 · v{chapter.versionNo} · {formatDateTime(chapter.updatedAt)}
              </p>
            </Link>
            <div className="flex shrink-0 items-center gap-1 self-start sm:self-auto">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onMove(chapter.id, "up")}
                disabled={index === 0}
                aria-label="上移章节"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onMove(chapter.id, "down")}
                disabled={index === chapters.length - 1}
                aria-label="下移章节"
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(chapter.id)}
                aria-label="删除章节"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <Link
            href={`/novels/${novelId}/chapters/${chapter.id}`}
            className="focus-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-ink sm:w-auto"
          >
            <FilePenLine className="h-4 w-4" aria-hidden="true" />
            编辑正文
          </Link>
        </Surface>
      ))}
    </div>
  );
}
