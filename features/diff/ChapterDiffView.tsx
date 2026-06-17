"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DiffViewer } from "@/components/diff/DiffViewer";
import { VersionSelector } from "@/components/diff/VersionSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";
import { apiFetch, getApiError } from "@/lib/api-client";
import type { Chapter, ChapterVersion, DiffResponse } from "@/lib/types";
import { formatDateTime, versionSourceLabel } from "@/lib/utils";

export function ChapterDiffView({
  novelId,
  chapterId,
  initialTo
}: {
  novelId: string;
  chapterId: string;
  initialTo?: string;
}) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [fromVersionId, setFromVersionId] = useState("");
  const [toVersionId, setToVersionId] = useState("");
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [changesOnly, setChangesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");

  const canCompare = useMemo(
    () => versions.length >= 2 && fromVersionId && toVersionId && fromVersionId !== toVersionId,
    [fromVersionId, toVersionId, versions.length]
  );
  const fromVersion = versions.find((version) => version.id === fromVersionId);
  const toVersion = versions.find((version) => version.id === toVersionId);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [chapterData, versionData] = await Promise.all([
        apiFetch<{ chapter: Chapter }>(`/api/chapters/${chapterId}`),
        apiFetch<{ versions: ChapterVersion[] }>(`/api/chapters/${chapterId}/versions`)
      ]);
      const loadedVersions = versionData.versions;
      setChapter(chapterData.chapter);
      setVersions(loadedVersions);
      setToVersionId(initialTo || loadedVersions[0]?.id || "");
      setFromVersionId(loadedVersions[1]?.id || loadedVersions[0]?.id || "");
    } catch (loadError) {
      setError(getApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [chapterId, initialTo]);

  const compare = useCallback(async (from: string, to: string) => {
    if (!from || !to || from === to) {
      setDiff(null);
      return;
    }

    setComparing(true);
    setError("");

    try {
      setDiff(await apiFetch<DiffResponse>(`/api/diff?fromVersionId=${from}&toVersionId=${to}`));
    } catch (compareError) {
      setError(getApiError(compareError));
    } finally {
      setComparing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (fromVersionId && toVersionId) {
      void compare(fromVersionId, toVersionId);
    }
  }, [compare, fromVersionId, toVersionId]);

  async function rollback(versionId: string) {
    if (!window.confirm("回滚会生成新的历史版本，确定继续？")) {
      return;
    }

    await apiFetch(`/api/chapters/${chapterId}/rollback`, {
      method: "POST",
      body: JSON.stringify({ versionId })
    });
    await load();
  }

  const sidebar = (
    <div className="grid gap-5 p-4 lg:p-5">
      <Link
        href={`/novels/${novelId}/chapters/${chapterId}/history`}
        className="focus-ring inline-flex h-10 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        返回历史
      </Link>
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Diff</p>
        <h1 className="mt-2 line-clamp-3 text-xl font-semibold text-slate-950">
          {chapter?.title || "版本对比"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">单栏合并视图</p>
      </section>

      <Surface className="grid gap-3 p-4">
        <VersionSelector
          label="版本 A"
          versions={versions}
          value={fromVersionId}
          onChange={setFromVersionId}
        />
        <VersionSelector
          label="版本 B"
          versions={versions}
          value={toVersionId}
          onChange={setToVersionId}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={changesOnly}
            onChange={(event) => setChangesOnly(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          只看变化
        </label>
      </Surface>

      <Button variant="secondary" onClick={() => toVersionId && rollback(toVersionId)} disabled={!toVersionId}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        回滚版本 B
      </Button>
    </div>
  );

  const aside = (
    <div className="grid gap-4 p-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Compare</p>
        <h2 className="mt-2 text-base font-semibold text-slate-950">对比信息</h2>
      </section>
      <VersionSummary label="版本 A" version={fromVersion} />
      <VersionSummary label="版本 B" version={toVersion} />
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        {diff ? `${diff.blocks.length.toLocaleString()} 个文本块` : "选择两个版本后显示差异。"}
      </div>
    </div>
  );

  return (
    <AppShell active="novels" sidebar={sidebar} sidebarLabel="对比设置" aside={aside} asideLabel="对比信息">
      {loading ? (
        <div className="grid min-h-64 place-items-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
      ) : error ? (
        <EmptyState title="加载失败" description={error} />
      ) : versions.length < 2 ? (
        <EmptyState title="版本不足" description="至少需要两个版本才能进行对比。" />
      ) : comparing ? (
        <div className="grid min-h-36 place-items-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        </div>
      ) : canCompare && diff ? (
        <DiffViewer blocks={diff.blocks} changesOnly={changesOnly} />
      ) : (
        <EmptyState title="请选择两个不同版本" />
      )}
    </AppShell>
  );
}

function VersionSummary({
  label,
  version
}: {
  label: string;
  version?: ChapterVersion;
}) {
  if (!version) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        {label} 未选择
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <Badge>{label}</Badge>
        <span className="text-sm font-semibold text-slate-900">v{version.versionNo}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{versionSourceLabel(version.source)}</p>
      <p className="mt-1 text-xs text-slate-500">
        {version.wordCount.toLocaleString()} 字 · {formatDateTime(version.createdAt)}
      </p>
    </div>
  );
}
