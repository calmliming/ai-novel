"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Edit3, Plus, Search, Settings, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chapter, NovelBundle } from "@/lib/types";

type ChapterNavProps = {
  novelId: string;
  chapterId: string;
  bundle: NovelBundle | null;
  activeChapter?: Chapter;
  onCreateChapter: () => void;
  /** Called when a chapter link is tapped — lets the mobile drawer close itself. */
  onNavigate?: () => void;
};

/**
 * Container-agnostic chapter navigation (cover, search, list, footer). Rendered
 * both inside the desktop `ChapterSidebar` pane and the mobile drawer, so it
 * carries no visibility/positioning classes of its own.
 */
export function ChapterNavContent({
  novelId,
  chapterId,
  bundle,
  activeChapter,
  onCreateChapter,
  onNavigate
}: ChapterNavProps) {
  const chapters = bundle?.chapters ?? [];
  const [chapterQuery, setChapterQuery] = useState("");
  const visibleChapters = chapters.filter((chapter) =>
    `${chapter.title} ${chapter.orderIndex + 1}`
      .toLowerCase()
      .includes(chapterQuery.trim().toLowerCase())
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-5">
        <div className="flex gap-4">
          <div className="grid h-[112px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-900 text-center text-sm font-semibold leading-5 text-white shadow-soft">
            {bundle?.novel.title.slice(0, 4) || "小说"}
          </div>
          <div className="min-w-0 pt-2">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-semibold text-slate-950">
                {bundle?.novel.title || "未命名小说"}
              </p>
              <Edit3 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              {bundle?.novel.genre || "现代"} · {bundle?.novel.style || "悬疑"}
            </p>
            <p className="text-xs leading-6 text-slate-500">
              字数：{bundle?.novel.totalWordCount ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_40px] gap-2">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-400">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              value={chapterQuery}
              onChange={(event) => setChapterQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
              placeholder="搜索章节"
            />
          </label>
          <button
            type="button"
            onClick={() => setChapterQuery("")}
            className="grid h-11 w-full place-items-center rounded-lg border border-slate-200 bg-white text-slate-500"
            aria-label="清除筛选"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <ChapterGroup
          title="卷一"
          progress={`${visibleChapters.length}/${chapters.length || 1}`}
          chapters={visibleChapters}
          novelId={novelId}
          chapterId={chapterId}
          activeChapter={activeChapter}
          onNavigate={onNavigate}
        />
      </div>

      <div className="flex h-14 shrink-0 items-center justify-between border-t border-slate-200 px-5">
        <button
          type="button"
          onClick={onCreateChapter}
          className="flex items-center gap-2 text-sm font-medium text-blue-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          新建章节
        </button>
        <Link href={`/novels/${novelId}?tab=settings`} aria-label="作品设置">
          <Settings className="h-4 w-4 text-slate-500" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** Desktop pane wrapper — adds positioning + breakpoint visibility. */
export function ChapterSidebar(props: ChapterNavProps) {
  return (
    <aside className="hidden h-full min-h-0 overflow-hidden border-r border-slate-200 bg-slate-50/80 lg:flex lg:flex-col">
      <ChapterNavContent {...props} />
    </aside>
  );
}

const ChapterGroup = memo(function ChapterGroup({
  title,
  progress,
  chapters,
  novelId,
  chapterId,
  activeChapter,
  onNavigate
}: {
  title: string;
  progress: string;
  chapters: Chapter[];
  novelId: string;
  chapterId: string;
  activeChapter?: Chapter;
  onNavigate?: () => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-600">
        <span className="flex items-center gap-1 font-medium">
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          {title}
        </span>
        <span>{progress}</span>
      </div>
      <div className="relative grid gap-1 pb-2 pl-4">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200" />
        {chapters.map((chapter, index) => {
          const active = chapter.id === chapterId;
          const wordCount = active
            ? activeChapter?.wordCount ?? chapter.wordCount
            : chapter.wordCount;
          return (
            <Link
              key={chapter.id}
              href={`/novels/${novelId}/chapters/${chapter.id}`}
              onClick={onNavigate}
              className={cn(
                "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-indigo-50 text-blue-700" : "text-slate-600 hover:bg-white"
              )}
            >
              <span
                className={cn(
                  "absolute -left-[11px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full",
                  active ? "bg-blue-700 ring-4 ring-indigo-100" : "bg-slate-300"
                )}
              />
              <span className="truncate">
                第{index + 1}章 {chapter.title}
              </span>
              <span className="shrink-0 text-xs text-slate-500">{wordCount}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
});
