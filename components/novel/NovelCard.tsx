import Link from "next/link";
import { BookMarked, Clock3, FileText } from "lucide-react";
import type { Chapter, Novel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatDateTime } from "@/lib/utils";

type NovelWithLatest = Novel & {
  latestChapter?: Chapter;
};

export function NovelCard({ novel }: { novel: NovelWithLatest }) {
  return (
    <Surface className="p-4 transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/novels/${novel.id}`} className="block truncate text-base font-semibold text-slate-950">
            {novel.title}
          </Link>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="bg-indigo-50 text-blue-700">{novel.genre || "未设置类型"}</Badge>
            <Badge>{statusText(novel.status)}</Badge>
          </div>
        </div>
        <BookMarked className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
      </div>

      {novel.synopsis ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{novel.synopsis}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {novel.totalWordCount} 字
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {formatDateTime(novel.updatedAt)}
        </div>
      </div>

      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
        最近章节：{novel.latestChapter?.title || "暂无章节"}
      </div>

      <Link
        href={`/novels/${novel.id}`}
        className="focus-ring mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        打开作品
      </Link>
    </Surface>
  );
}

function statusText(status: Novel["status"]) {
  const labels: Record<Novel["status"], string> = {
    draft: "草稿",
    writing: "连载中",
    completed: "已完结",
    archived: "归档"
  };

  return labels[status];
}
