"use client";

import { memo } from "react";
import Link from "next/link";
import { cn, formatDateTime, truncateText, versionSourceLabel } from "@/lib/utils";
import type { ChapterVersion, DiffBlock } from "@/lib/types";

type VersionPanelProps = {
  novelId: string;
  chapterId: string;
  versions: ChapterVersion[];
  diffBlocks: DiffBlock[];
  latestVersion?: ChapterVersion;
  previousVersion?: ChapterVersion;
  onNavigate?: () => void;
};

/** Container-agnostic version history + diff preview, shared by pane + drawer. */
export function VersionPanelContent({
  novelId,
  chapterId,
  versions,
  diffBlocks,
  latestVersion,
  previousVersion,
  onNavigate
}: VersionPanelProps) {
  const visibleDiffs = diffBlocks.filter((block) => block.type !== "same").slice(0, 4);

  return (
    <div className="grid min-h-0 grid-cols-1 min-[1600px]:grid-cols-[220px_minmax(0,1fr)]">
      <div className="border-b border-slate-200 bg-white min-[1600px]:border-b-0 min-[1600px]:border-r">
        <div className="flex h-12 items-end gap-5 border-b border-slate-200 px-4">
          <Link
            href={`/novels/${novelId}/chapters/${chapterId}/history`}
            onClick={onNavigate}
            className="border-b-2 border-blue-700 pb-3 text-sm font-semibold text-blue-700"
          >
            版本历史
          </Link>
          <Link
            href={`/novels/${novelId}/chapters/${chapterId}/diff`}
            onClick={onNavigate}
            className="pb-3 text-sm font-medium text-slate-500"
          >
            对比视图
          </Link>
        </div>
        <div className="max-h-[248px] overflow-y-auto p-3">
          {versions.slice(0, 5).map((version, index) => (
            <Link
              key={version.id}
              href={`/novels/${novelId}/chapters/${chapterId}/history`}
              onClick={onNavigate}
              className={cn(
                "mb-2 grid gap-1 rounded-lg border px-3 py-2 text-sm",
                index === 0 ? "border-blue-200 bg-indigo-50" : "border-transparent hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800">
                  {index === 0 ? "当前版本" : `v${version.versionNo}`}
                </span>
                {index === 0 ? (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600">
                    当前
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">
                {versionSourceLabel(version.source)} · {formatDateTime(version.createdAt)}
              </p>
              <p className="text-xs text-slate-500">{version.wordCount} 字</p>
            </Link>
          ))}
          <Link
            href={`/novels/${novelId}/chapters/${chapterId}/history`}
            onClick={onNavigate}
            className="mt-2 inline-flex text-xs font-medium text-blue-700"
          >
            查看全部历史版本（{versions.length}）
          </Link>
        </div>
      </div>

      <div className="min-w-0 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="truncate text-sm font-semibold text-slate-700">
            对比：v{previousVersion?.versionNo ?? "-"} → v{latestVersion?.versionNo ?? "-"}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-emerald-100" />
              新增
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-rose-100" />
              删除
            </span>
          </div>
        </div>
        <div className="max-h-[210px] overflow-auto rounded-lg border border-slate-200 bg-white p-3">
          {visibleDiffs.length ? (
            <div className="grid gap-2 text-sm leading-7">
              {visibleDiffs.map((block, index) => (
                <DiffPreviewLine key={`${block.type}-${index}`} block={block} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">暂无可展示的版本差异。</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Desktop bottom pane wrapper. */
export function BottomVersionPanel(props: VersionPanelProps) {
  return (
    <section className="hidden max-h-[220px] shrink-0 border-t border-slate-200 bg-slate-50 min-[1600px]:block">
      <VersionPanelContent {...props} />
    </section>
  );
}

const DiffPreviewLine = memo(function DiffPreviewLine({ block }: { block: DiffBlock }) {
  if (block.type === "changed") {
    return (
      <div className="grid gap-1">
        <p className="rounded bg-rose-50 px-2 text-rose-700 line-through">
          - {truncateText((block.oldText || "").replace(/\s+/g, " "), 150)}
        </p>
        <p className="rounded bg-emerald-50 px-2 text-emerald-700">
          + {truncateText((block.newText || "").replace(/\s+/g, " "), 150)}
        </p>
      </div>
    );
  }

  const text = (block.type === "removed" ? block.oldText : block.newText) || "";
  return (
    <p
      className={cn(
        "rounded px-2",
        block.type === "removed" && "bg-rose-50 text-rose-700 line-through",
        block.type === "added" && "bg-emerald-50 text-emerald-700"
      )}
    >
      {block.type === "removed" ? "- " : "+ "}
      {truncateText(text.replace(/\s+/g, " "), 150)}
    </p>
  );
});
