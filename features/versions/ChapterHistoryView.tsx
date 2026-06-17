"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, GitCompare, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { VersionTimeline } from "@/components/version/VersionTimeline";
import { apiFetch, getApiError } from "@/lib/api-client";
import type { Chapter, ChapterVersion } from "@/lib/types";
import { formatDateTime, versionSourceLabel } from "@/lib/utils";

export function ChapterHistoryView({
  novelId,
  chapterId
}: {
  novelId: string;
  chapterId: string;
}) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [chapterData, versionData] = await Promise.all([
        apiFetch<{ chapter: Chapter }>(`/api/chapters/${chapterId}`),
        apiFetch<{ versions: ChapterVersion[] }>(`/api/chapters/${chapterId}/versions`)
      ]);
      setChapter(chapterData.chapter);
      setVersions(versionData.versions);
    } catch (loadError) {
      setError(getApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sidebar = (
    <div className="grid gap-5 p-4 lg:p-5">
      <Link
        href={`/novels/${novelId}/chapters/${chapterId}`}
        className="focus-ring inline-flex h-10 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        返回编辑器
      </Link>
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">History</p>
        <h1 className="mt-2 line-clamp-3 text-xl font-semibold text-slate-950">
          {chapter?.title || "历史版本"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{versions.length} 个版本</p>
      </section>
      <Link
        href={`/novels/${novelId}/chapters/${chapterId}/diff`}
        className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
      >
        <GitCompare className="h-4 w-4" aria-hidden="true" />
        进入对比
      </Link>
    </div>
  );

  const aside = (
    <div className="grid gap-4 p-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Versions</p>
        <h2 className="mt-2 text-base font-semibold text-slate-950">版本快照</h2>
      </section>
      {versions.slice(0, 6).length ? (
        versions.slice(0, 6).map((version, index) => (
          <div key={version.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Badge>{index === 0 ? "当前" : `v${version.versionNo}`}</Badge>
              <span className="text-xs text-slate-500">{version.wordCount.toLocaleString()} 字</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{versionSourceLabel(version.source)}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDateTime(version.createdAt)}</p>
          </div>
        ))
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          暂无版本。
        </p>
      )}
    </div>
  );

  return (
    <AppShell active="novels" sidebar={sidebar} sidebarLabel="历史导航" aside={aside} asideLabel="版本快照">
      {loading ? (
        <div className="grid min-h-64 place-items-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
      ) : error ? (
        <EmptyState title="加载失败" description={error} />
      ) : (
        <VersionTimeline novelId={novelId} versions={versions} onRolledBack={load} />
      )}
    </AppShell>
  );
}
