"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { NovelCard } from "@/components/novel/NovelCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getApiError } from "@/lib/api-client";
import type { Chapter, Novel } from "@/lib/types";

type NovelWithLatest = Novel & {
  latestChapter?: Chapter;
};

export function NovelListView() {
  const [novels, setNovels] = useState<NovelWithLatest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    genre: "",
    style: "",
    synopsis: ""
  });

  useEffect(() => {
    void loadNovels();
  }, []);

  const totalWords = useMemo(
    () => novels.reduce((total, novel) => total + novel.totalWordCount, 0),
    [novels]
  );
  const latestNovel = novels[0];

  async function loadNovels() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{ novels: NovelWithLatest[] }>("/api/novels");
      setNovels(data.novels);
    } catch (loadError) {
      setError(getApiError(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function createNovel(event: FormEvent) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("请先填写作品标题。");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiFetch("/api/novels", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm({ title: "", genre: "", style: "", synopsis: "" });
      await loadNovels();
    } catch (createError) {
      setError(getApiError(createError));
    } finally {
      setSubmitting(false);
    }
  }

  const sidebar = (
    <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] sm:items-start lg:grid-cols-1 lg:p-5">
      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-normal text-slate-950">作品库</h1>
            <p className="mt-1 text-sm text-slate-500">
              {novels.length} 部作品，{totalWords.toLocaleString()} 字
            </p>
          </div>
          <Button size="icon" variant="secondary" onClick={loadNovels} aria-label="刷新作品">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <form className="grid gap-3" onSubmit={createNovel}>
        <Input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="新作品标题"
        />
        <Input
          value={form.genre}
          onChange={(event) => setForm((current) => ({ ...current, genre: event.target.value }))}
          placeholder="类型，例如：悬疑 / 玄幻 / 都市"
        />
        <Input
          value={form.style}
          onChange={(event) => setForm((current) => ({ ...current, style: event.target.value }))}
          placeholder="文风，例如：克制、快节奏"
        />
        <Textarea
          value={form.synopsis}
          onChange={(event) => setForm((current) => ({ ...current, synopsis: event.target.value }))}
          rows={5}
          placeholder="一句话简介"
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          新建小说
        </Button>
      </form>

      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-1">
          {error}
        </p>
      ) : null}
    </div>
  );

  const aside = (
    <div className="grid gap-5 p-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overview</p>
        <h2 className="mt-2 text-base font-semibold text-slate-950">写作概览</h2>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="作品" value={novels.length.toLocaleString()} />
        <Metric label="总字数" value={totalWords.toLocaleString()} />
      </div>
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">最近更新</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {latestNovel ? latestNovel.title : "暂无作品"}
        </p>
        {latestNovel?.latestChapter ? (
          <p className="mt-1 text-xs text-slate-500">{latestNovel.latestChapter.title}</p>
        ) : null}
      </section>
    </div>
  );

  return (
    <AppShell active="novels" sidebar={sidebar} sidebarLabel="作品操作" aside={aside} asideLabel="作品概览">
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-950">最近作品</p>
            <p className="mt-1 text-sm text-slate-500">按更新时间排序</p>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>
        ) : novels.length ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        ) : (
          <EmptyState title="还没有作品" description="先创建一本小说，写作工作台会自动生成。" />
        )}
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
