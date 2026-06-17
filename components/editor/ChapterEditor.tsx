"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  ArrowLeft,
  BadgeCheck,
  Bold,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Download,
  Edit3,
  FileText,
  History,
  Italic,
  Layers3,
  List,
  ListOrdered,
  ListTree,
  Loader2,
  Maximize2,
  Menu,
  Minimize2,
  PenLine,
  Plus,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Strikethrough,
  Sun,
  Tags,
  Underline,
  User,
  Users,
  Wand2
} from "lucide-react";
import { AIPreviewDrawer } from "@/components/editor/AIPreviewDrawer";
import { Button } from "@/components/ui/button";
import { apiFetch, getApiError } from "@/lib/api-client";
import {
  deleteLocalDraft,
  getLocalDraft,
  markDraftSynced,
  saveLocalDraft
} from "@/lib/indexeddb";
import type {
  AIWriteResponse,
  AIWriteTask,
  CharacterProfile,
  Chapter,
  ChapterVersion,
  DiffBlock,
  DiffResponse,
  NovelBundle,
  OutlineItem,
  SyncStatus,
  VersionSource,
  WorldSetting
} from "@/lib/types";
import { cn, formatDateTime, truncateText, versionSourceLabel } from "@/lib/utils";
import { countWords } from "@/lib/word-count";

type ChapterPatchResponse = {
  status: "ok";
  chapter: Chapter;
  changed: boolean;
};

type ConflictBody = {
  error: "version_conflict";
  serverChapter: Chapter;
};

const sourceByTask: Partial<Record<AIWriteTask, VersionSource>> = {
  continue: "ai_continue",
  rewrite: "ai_rewrite",
  polish: "ai_polish",
  expand: "ai_expand",
  shorten: "ai_shorten"
};

const aiActions: Array<{
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

export function ChapterEditor({
  novelId,
  chapterId
}: {
  novelId: string;
  chapterId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<NovelBundle | null>(null);
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [diffBlocks, setDiffBlocks] = useState<DiffBlock[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [baseVersionNo, setBaseVersionNo] = useState(1);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflictChapter, setConflictChapter] = useState<Chapter | null>(null);
  const [runningTask, setRunningTask] = useState<AIWriteTask | undefined>();
  const [preview, setPreview] = useState<
    | {
        task: AIWriteTask;
        result: AIWriteResponse;
      }
    | undefined
  >();
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });
  const loadedRef = useRef(false);
  const titleRef = useRef("");
  const contentRef = useRef("");
  const baseVersionRef = useRef(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void loadWorkspace();
    // loadWorkspace is intentionally scoped to the route ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId, chapterId]);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
    baseVersionRef.current = baseVersionNo;
  }, [title, content, baseVersionNo]);

  useEffect(() => {
    if (!loadedRef.current || conflictChapter) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persist({
        nextTitle: titleRef.current,
        nextContent: contentRef.current,
        source: "auto_save"
      });
    }, 1500);

    return () => window.clearTimeout(timeout);
    // persist reads the latest editor values from refs to avoid stale autosaves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, conflictChapter]);

  const currentWordCount = countWords(content);
  const latestVersion = versions[0];
  const previousVersion = versions[1];
  const activeChapter = useMemo(
    () => bundle?.chapters.find((chapter) => chapter.id === chapterId),
    [bundle?.chapters, chapterId]
  );
  const activeCharacter = bundle?.characters[0];
  const importantWorld = bundle?.worldSettings[0];
  const nextOutline = bundle?.outlines[0];
  const smartTags = useMemo(
    () => buildSmartTags(bundle, title),
    [bundle, title]
  );

  async function loadWorkspace() {
    setLoading(true);
    setError("");

    try {
      const [chapterData, bundleData, versionData] = await Promise.all([
        apiFetch<{ chapter: Chapter }>(`/api/chapters/${chapterId}`),
        apiFetch<NovelBundle>(`/api/novels/${novelId}`),
        apiFetch<{ versions: ChapterVersion[] }>(`/api/chapters/${chapterId}/versions`)
      ]);
      let nextTitle = chapterData.chapter.title;
      let nextContent = chapterData.chapter.content;
      let nextBaseVersionNo = chapterData.chapter.versionNo;
      let nextSyncStatus: SyncStatus = "synced";
      const draft = await getLocalDraft(chapterId);

      if (
        draft &&
        draft.syncStatus !== "synced" &&
        new Date(draft.updatedAt).getTime() > new Date(chapterData.chapter.updatedAt).getTime()
      ) {
        const restore = window.confirm("检测到本地草稿比服务器更新，是否恢复本地草稿？");

        if (restore) {
          nextTitle = draft.title;
          nextContent = draft.content;
          nextBaseVersionNo = draft.baseVersionNo;
          nextSyncStatus = draft.syncStatus;
        } else {
          await deleteLocalDraft(chapterId);
        }
      }

      setBundle(bundleData);
      setVersions(versionData.versions);
      setTitle(nextTitle);
      setContent(nextContent);
      setBaseVersionNo(nextBaseVersionNo);
      setSelection({ start: nextContent.length, end: nextContent.length, text: "" });
      setSyncStatus(nextSyncStatus);
      loadedRef.current = true;
      await loadPreviewDiff(versionData.versions);
    } catch (loadError) {
      setError(getApiError(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function loadVersionsAndDiff() {
    const versionData = await apiFetch<{ versions: ChapterVersion[] }>(
      `/api/chapters/${chapterId}/versions`
    );
    setVersions(versionData.versions);
    await loadPreviewDiff(versionData.versions);
  }

  async function loadPreviewDiff(nextVersions: ChapterVersion[]) {
    if (nextVersions.length < 2) {
      setDiffBlocks([]);
      return;
    }

    const response = await apiFetch<DiffResponse>(
      `/api/diff?fromVersionId=${nextVersions[1].id}&toVersionId=${nextVersions[0].id}`
    );
    setDiffBlocks(response.blocks);
  }

  function updateTitle(value: string) {
    setTitle(value);
    setSyncStatus("local");
    void saveDraft(value, contentRef.current, "local");
  }

  function updateContent(value: string) {
    setContent(value);
    setSyncStatus("local");
    void saveDraft(titleRef.current, value, "local");
  }

  async function saveDraft(nextTitle: string, nextContent: string, status: SyncStatus) {
    await saveLocalDraft({
      chapterId,
      novelId,
      title: nextTitle,
      content: nextContent,
      baseVersionNo: baseVersionRef.current,
      updatedAt: new Date().toISOString(),
      syncStatus: status
    });
  }

  async function persist({
    nextTitle,
    nextContent,
    source,
    createVersion = false,
    sourceLabel,
    aiJobId,
    aiModel,
    force = false
  }: {
    nextTitle: string;
    nextContent: string;
    source: VersionSource;
    createVersion?: boolean;
    sourceLabel?: string;
    aiJobId?: string;
    aiModel?: string;
    force?: boolean;
  }) {
    setSaving(true);
    setSyncStatus("syncing");
    await saveDraft(nextTitle, nextContent, "syncing");

    try {
      const result = await apiFetch<ChapterPatchResponse>(`/api/chapters/${chapterId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: nextTitle,
          content: nextContent,
          baseVersionNo: baseVersionRef.current,
          createVersion,
          versionSource: source,
          sourceLabel,
          aiJobId,
          aiModel,
          force
        })
      });

      setBaseVersionNo(result.chapter.versionNo);
      baseVersionRef.current = result.chapter.versionNo;
      setConflictChapter(null);
      setSyncStatus("synced");
      await markDraftSynced(chapterId, result.chapter.versionNo);
      setError("");

      if (createVersion) {
        await Promise.all([loadVersionsAndDiff(), refreshBundle()]);
      }

      return result.chapter;
    } catch (saveError) {
      const apiError = saveError as Error & { status?: number; body?: ConflictBody };

      if (apiError.status === 409 && apiError.body?.serverChapter) {
        setConflictChapter(apiError.body.serverChapter);
        setSyncStatus("conflict");
        await saveDraft(nextTitle, nextContent, "conflict");
      } else {
        setSyncStatus("local");
        setError(getApiError(saveError));
      }

      return null;
    } finally {
      setSaving(false);
    }
  }

  async function refreshBundle() {
    setBundle(await apiFetch<NovelBundle>(`/api/novels/${novelId}`));
  }

  async function manualSave() {
    await persist({
      nextTitle: titleRef.current,
      nextContent: contentRef.current,
      source: "manual_save",
      createVersion: true,
      sourceLabel: "手动保存"
    });
  }

  async function createChapter() {
    const data = await apiFetch<{ chapter: Chapter }>(`/api/novels/${novelId}/chapters`, {
      method: "POST",
      body: JSON.stringify({ title: "新章节" })
    });
    window.location.href = `/novels/${novelId}/chapters/${data.chapter.id}`;
  }

  async function runAI(task: AIWriteTask) {
    setRunningTask(task);
    setError("");

    try {
      const selectedText = selection.text || (task === "continue" ? undefined : contentRef.current);
      const result = await apiFetch<AIWriteResponse>(`/api/ai/${task}`, {
        method: "POST",
        body: JSON.stringify({
          novelId,
          chapterId,
          selectedText,
          targetWords: task === "continue" ? 800 : undefined,
          modelMode: task === "continue" ? "pro" : "fast"
        })
      });
      setPreview({ task, result });
    } catch (aiError) {
      setError(getApiError(aiError));
    } finally {
      setRunningTask(undefined);
    }
  }

  async function applyAI(mode: "insert" | "replace" | "append") {
    if (!preview) {
      return;
    }

    const aiContent = preview.result.content.trim();
    const current = contentRef.current;
    let nextContent = current;

    if (mode === "append") {
      nextContent = current.trimEnd() ? `${current.trimEnd()}\n\n${aiContent}` : aiContent;
    }

    if (mode === "replace") {
      if (selection.start !== selection.end) {
        nextContent = `${current.slice(0, selection.start)}${aiContent}${current.slice(
          selection.end
        )}`;
      } else {
        nextContent = aiContent;
      }
    }

    if (mode === "insert") {
      const insertAt = selection.start || current.length;
      nextContent = `${current.slice(0, insertAt)}${aiContent}${current.slice(insertAt)}`;
    }

    setContent(nextContent);
    contentRef.current = nextContent;
    await saveDraft(titleRef.current, nextContent, "local");
    await persist({
      nextTitle: titleRef.current,
      nextContent,
      source: sourceByTask[preview.task] ?? "manual_save",
      createVersion: true,
      sourceLabel: `AI ${taskLabel(preview.task)}`,
      aiJobId: preview.result.jobId,
      aiModel: preview.result.model
    });
    setPreview(undefined);
  }

  async function copyAI() {
    if (preview?.result.content) {
      await navigator.clipboard.writeText(preview.result.content);
    }
  }

  async function useServerVersion() {
    if (!conflictChapter) {
      return;
    }

    setTitle(conflictChapter.title);
    setContent(conflictChapter.content);
    setBaseVersionNo(conflictChapter.versionNo);
    baseVersionRef.current = conflictChapter.versionNo;
    setConflictChapter(null);
    setSyncStatus("synced");
    await deleteLocalDraft(chapterId);
  }

  async function overwriteServer() {
    await persist({
      nextTitle: titleRef.current,
      nextContent: contentRef.current,
      source: "manual_save",
      createVersion: true,
      sourceLabel: "冲突覆盖保存",
      force: true
    });
  }

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[#f8fafc] text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[76px_220px_minmax(0,1fr)] xl:grid-cols-[80px_232px_minmax(0,1fr)_300px] min-[1800px]:grid-cols-[188px_256px_minmax(0,1fr)_334px]">
        <PrimarySidebar novelId={novelId} chapterId={chapterId} bundle={bundle} />

        <ChapterSidebar
          novelId={novelId}
          chapterId={chapterId}
          bundle={bundle}
          activeChapter={activeChapter}
          onCreateChapter={createChapter}
        />

        <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-x border-slate-200 bg-white">
          <TopBar
            novelId={novelId}
            title={title}
            syncStatus={syncStatus}
            saving={saving}
            currentWordCount={currentWordCount}
            totalWordCount={bundle?.novel.totalWordCount ?? currentWordCount}
            onManualSave={manualSave}
          />

          {error ? (
            <div className="px-5 pt-4">
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            </div>
          ) : null}

          {conflictChapter ? (
            <div className="px-5 pt-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-slate-900">该章节已在其他位置更新。</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={useServerVersion}>
                    使用服务器版本
                  </Button>
                  <Button onClick={overwriteServer}>覆盖保存为新版本</Button>
                </div>
              </div>
            </div>
          ) : null}

          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <article className="mx-auto flex min-h-0 w-full max-w-[920px] flex-1 flex-col overflow-hidden px-4 py-5 sm:px-6 md:px-8 lg:py-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <input
                  value={title}
                  onChange={(event) => updateTitle(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[24px] font-semibold tracking-normal text-slate-950 outline-none sm:text-[26px] lg:text-[28px]"
                  placeholder="章节标题"
                />
                <Link
                  href={`/novels/${novelId}?tab=settings`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="章节设置"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => updateContent(event.target.value)}
                onSelect={(event) => {
                  const target = event.currentTarget;
                  setSelection({
                    start: target.selectionStart,
                    end: target.selectionEnd,
                    text: target.value.slice(target.selectionStart, target.selectionEnd)
                  });
                }}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent text-[16px] leading-[2.15] text-slate-800 outline-none placeholder:text-slate-300 sm:leading-[2.25] lg:text-[17px]"
                placeholder="开始写正文..."
              />

              <FloatingAIBar runningTask={runningTask} onRun={runAI} />
            </article>

            <FormatToolbar wordCount={currentWordCount} />
            <BottomVersionPanel
              novelId={novelId}
              chapterId={chapterId}
              versions={versions}
              diffBlocks={diffBlocks}
              latestVersion={latestVersion}
              previousVersion={previousVersion}
            />
          </main>
        </section>

        <AIAssistantPanel
          character={activeCharacter}
          worldSetting={importantWorld}
          outline={nextOutline}
          tags={smartTags}
          onRun={runAI}
          runningTask={runningTask}
        />
      </div>

      {preview ? (
        <AIPreviewDrawer
          task={preview.task}
          content={preview.result.content}
          applying={saving}
          onApply={applyAI}
          onCopy={copyAI}
          onClose={() => setPreview(undefined)}
          onRegenerate={() => runAI(preview.task)}
        />
      ) : null}
    </div>
  );
}

function PrimarySidebar({
  novelId,
  chapterId,
  bundle
}: {
  novelId: string;
  chapterId: string;
  bundle: NovelBundle | null;
}) {
  const navItems = [
    { label: "小说", icon: BookOpen, active: true },
    { label: "章节", icon: FileText },
    { label: "大纲", icon: ListTree },
    { label: "角色", icon: Users },
    { label: "设定", icon: Settings },
    { label: "历史", icon: History },
    { label: "我的", icon: User }
  ];

  void navItems;

  const sidebarItems = [
    { label: "小说", icon: BookOpen, href: `/novels/${novelId}`, active: false },
    { label: "章节", icon: FileText, href: `/novels/${novelId}/chapters/${chapterId}`, active: true },
    { label: "大纲", icon: ListTree, href: `/novels/${novelId}?tab=outline`, active: false },
    { label: "角色", icon: Users, href: `/novels/${novelId}?tab=characters`, active: false },
    { label: "设定", icon: Settings, href: `/novels/${novelId}?tab=world`, active: false },
    { label: "历史", icon: History, href: `/novels/${novelId}/chapters/${chapterId}/history`, active: false },
    { label: "我的", icon: User, href: "/login", active: false }
  ];

  return (
    <aside className="hidden h-full min-h-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 md:flex md:flex-col min-[1800px]:px-4 min-[1800px]:py-5">
      <Link href="/novels" className="flex items-center justify-center gap-3 min-[1800px]:justify-start">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="hidden min-[1800px]:block">
          <span className="block text-lg font-semibold leading-5 text-slate-950">墨续 AI</span>
          <span className="text-xs text-slate-500">Moxu Writer</span>
        </span>
      </Link>

      <nav className="mt-9 grid gap-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              onClick={(event) => {
                event.preventDefault();
                window.location.href = item.href;
              }}
              href={item.label === "小说" ? "/novels" : "#"}
              className={cn(
                "flex h-12 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition min-[1800px]:justify-start",
                item.active
                  ? "bg-indigo-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="hidden min-[1800px]:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-4">
        <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center min-[1800px]:block">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
            <SmartphoneIcon />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">移动端写作</p>
          <p className="mt-1 text-xs text-slate-500">随时随地，灵感不断</p>
          <button
            type="button"
            disabled
            className="mt-3 h-9 w-full cursor-not-allowed rounded-lg bg-slate-100 text-sm font-medium text-slate-400"
          >
            扫码体验
          </button>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-center gap-3 min-[1800px]:justify-start">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              墨
            </div>
            <div className="hidden min-w-0 min-[1800px]:block">
              <p className="truncate text-sm font-semibold text-slate-900">墨续用户</p>
              <p className="text-xs text-slate-500">到期时间：2025-06-30</p>
            </div>
          </div>
          <div className="mt-3 hidden h-1.5 overflow-hidden rounded-full bg-slate-200 min-[1800px]:block">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((bundle?.novel.totalWordCount ?? 0) / 200000) * 100)
                )}%`
              }}
            />
          </div>
          <p className="mt-2 hidden text-xs text-slate-500 min-[1800px]:block">
            字数额度：{bundle?.novel.totalWordCount ?? 0} / 200,000
          </p>
        </div>
      </div>
    </aside>
  );
}

function ChapterSidebar({
  novelId,
  chapterId,
  bundle,
  activeChapter,
  onCreateChapter
}: {
  novelId: string;
  chapterId: string;
  bundle: NovelBundle | null;
  activeChapter?: Chapter;
  onCreateChapter: () => void;
}) {
  const chapters = bundle?.chapters ?? [];
  const [chapterQuery, setChapterQuery] = useState("");
  const visibleChapters = chapters.filter((chapter) =>
    `${chapter.title} ${chapter.orderIndex + 1}`.toLowerCase().includes(chapterQuery.trim().toLowerCase())
  );

  return (
    <aside className="hidden h-full min-h-0 overflow-hidden border-r border-slate-200 bg-slate-50/80 lg:flex lg:flex-col">
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
            <p className="text-xs leading-6 text-slate-500">字数：{bundle?.novel.totalWordCount ?? 0}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_36px] gap-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-400">
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
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500"
            aria-label="章节筛选"
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
        />
      </div>

      <div className="flex h-14 items-center justify-between border-t border-slate-200 px-5">
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
    </aside>
  );
}

function ChapterGroup({
  title,
  progress,
  chapters,
  novelId,
  chapterId,
  activeChapter
}: {
  title: string;
  progress: string;
  chapters: Chapter[];
  novelId: string;
  chapterId: string;
  activeChapter?: Chapter;
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
          const wordCount = active ? activeChapter?.wordCount ?? chapter.wordCount : chapter.wordCount;
          return (
            <Link
              key={chapter.id}
              href={`/novels/${novelId}/chapters/${chapter.id}`}
              className={cn(
                "relative grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
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
              <span className="text-xs text-slate-500">{wordCount}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TopBar({
  novelId,
  title,
  syncStatus,
  saving,
  currentWordCount,
  totalWordCount,
  onManualSave
}: {
  novelId: string;
  title: string;
  syncStatus: SyncStatus;
  saving: boolean;
  currentWordCount: number;
  totalWordCount: number;
  onManualSave: () => void;
}) {
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-slate-200 bg-white px-3 py-2 sm:gap-3 sm:px-4 lg:h-20 lg:px-7 lg:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Link
          href={`/novels/${novelId}`}
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-50 md:hidden"
          aria-label="返回作品"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => {
            window.location.href = `/novels/${novelId}`;
          }}
          className="hidden h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-50 md:grid"
          aria-label="菜单"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 text-sm text-slate-500">
          <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
            <span className="hidden shrink-0 sm:inline">长夜潮声</span>
            <span className="hidden shrink-0 sm:inline">/</span>
            <span className="min-w-0 truncate font-medium text-slate-700">{title || "未命名章节"}</span>
            <ChevronDown className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-4 whitespace-nowrap text-sm text-slate-500 min-[1800px]:flex">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <span>{syncText(syncStatus)}</span>
          <span>{new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <span>本章字数：{currentWordCount.toLocaleString()}</span>
        <span>全文字数：{totalWordCount.toLocaleString()}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onManualSave}
          className="hidden h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:grid"
          aria-label="同步"
        >
          <Cloud className="h-4 w-4" aria-hidden="true" />
        </button>
        <Button onClick={onManualSave} disabled={saving} className="h-10 bg-blue-700 px-5 hover:bg-blue-800">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          保存
        </Button>
        <a
          href={`/api/novels/${novelId}/export?format=md`}
          className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 xl:flex"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          导出
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </a>
        <button
          type="button"
          disabled
          className="hidden h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 min-[1800px]:grid"
          aria-label="移动预览"
        >
          <SmartphoneIcon />
        </button>
        <button
          type="button"
          disabled
          className="hidden h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 min-[1800px]:grid"
          aria-label="主题"
        >
          <Sun className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="hidden h-10 w-10 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white min-[1800px]:grid">
          墨
        </div>
      </div>
    </header>
  );
}

function FloatingAIBar({
  runningTask,
  onRun
}: {
  runningTask?: AIWriteTask;
  onRun: (task: AIWriteTask) => void;
}) {
  return (
    <div className="sticky bottom-4 mx-auto mt-6 flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-indigo-100 bg-white/95 p-2 shadow-[0_18px_45px_rgba(37,99,235,0.18)] backdrop-blur sm:bottom-8 sm:w-fit">
      {aiActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.task}
            type="button"
            onClick={() => onRun(action.task)}
            disabled={Boolean(runningTask)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-blue-700 transition hover:bg-indigo-50 disabled:opacity-50",
              runningTask === action.task && "bg-indigo-50"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {action.label}
          </button>
        );
      })}
      <button
        type="button"
        disabled
        className="grid h-10 w-10 shrink-0 cursor-not-allowed place-items-center rounded-xl text-slate-300"
        aria-label="更多 AI 功能"
      >
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function FormatToolbar({ wordCount }: { wordCount: number }) {
  const icons = [ArrowLeft, AlignLeft, Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignCenter];

  return (
    <div className="hidden h-12 shrink-0 items-center justify-between gap-3 border-y border-slate-200 bg-white px-4 text-slate-600 md:flex">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto lg:gap-2">
        {icons.map((Icon, index) => (
          <button
            key={index}
            type="button"
            disabled
            className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-md text-slate-300"
            aria-label="格式工具"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">字数：{wordCount.toLocaleString()}</p>
    </div>
  );
}

function BottomVersionPanel({
  novelId,
  chapterId,
  versions,
  diffBlocks,
  latestVersion,
  previousVersion
}: {
  novelId: string;
  chapterId: string;
  versions: ChapterVersion[];
  diffBlocks: DiffBlock[];
  latestVersion?: ChapterVersion;
  previousVersion?: ChapterVersion;
}) {
  const visibleDiffs = diffBlocks.filter((block) => block.type !== "same").slice(0, 4);

  return (
    <section className="hidden max-h-[220px] shrink-0 grid-cols-[180px_minmax(0,1fr)] border-t border-slate-200 bg-slate-50 min-[1600px]:grid min-[1800px]:grid-cols-[220px_minmax(0,1fr)]">
      <div className="border-r border-slate-200 bg-white">
        <div className="flex h-12 items-end gap-5 border-b border-slate-200 px-4">
          <Link
            href={`/novels/${novelId}/chapters/${chapterId}/history`}
            className="border-b-2 border-blue-700 pb-3 text-sm font-semibold text-blue-700"
          >
            版本历史
          </Link>
          <Link
            href={`/novels/${novelId}/chapters/${chapterId}/diff`}
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
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600">当前</span>
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
            className="mt-2 inline-flex text-xs font-medium text-blue-700"
          >
            查看全部历史版本（{versions.length}）
          </Link>
        </div>
      </div>

      <div className="min-w-0 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-slate-700">
            对比：v{previousVersion?.versionNo ?? "-"} → v{latestVersion?.versionNo ?? "-"}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
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
    </section>
  );
}

function DiffPreviewLine({ block }: { block: DiffBlock }) {
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
}

function AIAssistantPanel({
  character,
  worldSetting,
  outline,
  tags,
  onRun,
  runningTask
}: {
  character?: CharacterProfile;
  worldSetting?: WorldSetting;
  outline?: OutlineItem;
  tags: string[];
  onRun: (task: AIWriteTask) => void;
  runningTask?: AIWriteTask;
}) {
  return (
    <aside className="hidden h-full min-h-0 overflow-y-auto bg-white px-5 py-6 xl:block">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">AI 助手</h2>
        </div>
        <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </div>

      <div className="grid gap-4">
        <AssistantCard
          title="写作建议"
          icon={Bot}
          actionLabel="查看更多建议"
          onAction={() => onRun("check-consistency")}
          loading={runningTask === "check-consistency"}
        >
          <ul className="grid gap-3 text-sm leading-6 text-slate-600">
            <li>本章情绪基调偏向压抑，可在中段加入动作描写增强节奏。</li>
            <li>“信”的内容是推动情节的关键，建议在下一段增加心理波动。</li>
          </ul>
        </AssistantCard>

        <AssistantCard title="人物一致性" icon={BadgeCheck} badge="一致性良好">
          <div className="flex gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {character?.name.slice(0, 1) || "角"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">{character?.name || "未设置角色"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {character?.role || "角色"} · {character?.age || "年龄未设"}
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
            <li>性格：{character?.personality || "暂无"}</li>
            <li>说话风格：{character?.speechStyle || "暂无"}</li>
            <li>当前情绪：{character?.motivation || "等待补充"}</li>
          </ul>
        </AssistantCard>

        <AssistantCard
          title="下一章大纲"
          icon={FileText}
          actionLabel="生成完整章节"
          onAction={() => onRun("generate-outline")}
          loading={runningTask === "generate-outline"}
        >
          <p className="text-sm font-semibold text-slate-900">{outline?.title || "下一章"}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {outline?.content || "暂无大纲，可由 AI 根据当前章节生成。"}
          </p>
        </AssistantCard>

        <AssistantCard title="智能标签" icon={Tags}>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                {tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            disabled
            className="mt-4 cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400"
          >
            + 添加标签
          </button>
        </AssistantCard>

        {worldSetting ? (
          <AssistantCard title={worldSetting.title} icon={Layers3}>
            <p className="text-sm leading-6 text-slate-600">{worldSetting.content}</p>
          </AssistantCard>
        ) : null}
      </div>
    </aside>
  );
}

function AssistantCard({
  title,
  icon: Icon,
  badge,
  actionLabel,
  onAction,
  loading,
  children
}: {
  title: string;
  icon: typeof Sparkles;
  badge?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {badge ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </span>
        ) : (
          <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
        )}
      </div>
      {children}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={loading}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-medium text-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function SmartphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function syncText(status: SyncStatus) {
  const labels: Record<SyncStatus, string> = {
    local: "本地草稿",
    syncing: "同步中",
    synced: "自动保存成功",
    conflict: "有冲突"
  };

  return labels[status];
}

function taskLabel(task: AIWriteTask) {
  const labels: Partial<Record<AIWriteTask, string>> = {
    continue: "续写",
    rewrite: "改写",
    polish: "润色",
    expand: "扩写",
    shorten: "缩写"
  };

  return labels[task] ?? task;
}

function buildSmartTags(bundle: NovelBundle | null, chapterTitle: string) {
  const seeds = [
    bundle?.novel.genre,
    bundle?.novel.style?.split(/[、,，\s]+/)[0],
    chapterTitle.replace(/^第.+?章\s*/, "").split(/\s+/)[0],
    bundle?.characters[0]?.name,
    bundle?.worldSettings[0]?.category
  ].filter(Boolean) as string[];

  return Array.from(new Set([...seeds, "续写", "伏笔"])).slice(0, 6);
}
