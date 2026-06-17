"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiTaskLabel } from "@/lib/labels";
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
  Chapter,
  ChapterVersion,
  DiffBlock,
  DiffResponse,
  NovelBundle,
  SyncStatus,
  VersionSource
} from "@/lib/types";
import { countWords } from "@/lib/word-count";
import { buildSmartTags, sourceByTask } from "@/components/editor/constants";

type ChapterPatchResponse = {
  status: "ok";
  chapter: Chapter;
  changed: boolean;
};

type ConflictBody = {
  error: "version_conflict";
  serverChapter: Chapter;
};

type Preview = {
  task: AIWriteTask;
  result: AIWriteResponse;
};

/**
 * Owns all chapter-editor state, autosave, AI orchestration and conflict
 * handling. Extracted from ChapterEditor so the view layer is purely
 * presentational and the desktop panes / mobile drawers can share it.
 */
export function useChapterWorkspace(novelId: string, chapterId: string) {
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
  const [preview, setPreview] = useState<Preview | undefined>();
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });

  const loadedRef = useRef(false);
  const titleRef = useRef("");
  const contentRef = useRef("");
  const baseVersionRef = useRef(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
    baseVersionRef.current = baseVersionNo;
  }, [title, content, baseVersionNo]);

  const refreshBundle = useCallback(async () => {
    setBundle(await apiFetch<NovelBundle>(`/api/novels/${novelId}`));
  }, [novelId]);

  const loadPreviewDiff = useCallback(async (nextVersions: ChapterVersion[]) => {
    if (nextVersions.length < 2) {
      setDiffBlocks([]);
      return;
    }

    const response = await apiFetch<DiffResponse>(
      `/api/diff?fromVersionId=${nextVersions[1].id}&toVersionId=${nextVersions[0].id}`
    );
    setDiffBlocks(response.blocks);
  }, []);

  const loadVersionsAndDiff = useCallback(async () => {
    const versionData = await apiFetch<{ versions: ChapterVersion[] }>(
      `/api/chapters/${chapterId}/versions`
    );
    setVersions(versionData.versions);
    await loadPreviewDiff(versionData.versions);
  }, [chapterId, loadPreviewDiff]);

  const saveDraft = useCallback(
    async (nextTitle: string, nextContent: string, status: SyncStatus) => {
      await saveLocalDraft({
        chapterId,
        novelId,
        title: nextTitle,
        content: nextContent,
        baseVersionNo: baseVersionRef.current,
        updatedAt: new Date().toISOString(),
        syncStatus: status
      });
    },
    [chapterId, novelId]
  );

  const persist = useCallback(
    async ({
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
    }) => {
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
    },
    [chapterId, saveDraft, loadVersionsAndDiff, refreshBundle]
  );

  const loadWorkspace = useCallback(async () => {
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
  }, [novelId, chapterId, loadPreviewDiff]);

  useEffect(() => {
    loadedRef.current = false;
    void loadWorkspace();
  }, [loadWorkspace]);

  // 1.5s debounced autosave. Reads the latest editor values from refs so the
  // timer never persists stale text; intentionally does not depend on persist
  // beyond its stable identity.
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
  }, [title, content, conflictChapter, persist]);

  const updateTitle = useCallback(
    (value: string) => {
      setTitle(value);
      setSyncStatus("local");
      void saveDraft(value, contentRef.current, "local");
    },
    [saveDraft]
  );

  const updateContent = useCallback(
    (value: string) => {
      setContent(value);
      setSyncStatus("local");
      void saveDraft(titleRef.current, value, "local");
    },
    [saveDraft]
  );

  const onSelect = useCallback((event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    setSelection({
      start: target.selectionStart,
      end: target.selectionEnd,
      text: target.value.slice(target.selectionStart, target.selectionEnd)
    });
  }, []);

  const manualSave = useCallback(async () => {
    await persist({
      nextTitle: titleRef.current,
      nextContent: contentRef.current,
      source: "manual_save",
      createVersion: true,
      sourceLabel: "手动保存"
    });
  }, [persist]);

  const createChapter = useCallback(async () => {
    const data = await apiFetch<{ chapter: Chapter }>(`/api/novels/${novelId}/chapters`, {
      method: "POST",
      body: JSON.stringify({ title: "新章节" })
    });
    window.location.href = `/novels/${novelId}/chapters/${data.chapter.id}`;
  }, [novelId]);

  const runAI = useCallback(
    async (task: AIWriteTask) => {
      setRunningTask(task);
      setError("");

      try {
        const selectedText =
          selection.text || (task === "continue" ? undefined : contentRef.current);
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
    },
    [novelId, chapterId, selection.text]
  );

  const applyAI = useCallback(
    async (mode: "insert" | "replace" | "append") => {
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
        sourceLabel: `AI ${aiTaskLabel(preview.task)}`,
        aiJobId: preview.result.jobId,
        aiModel: preview.result.model
      });
      setPreview(undefined);
    },
    [preview, selection.start, selection.end, saveDraft, persist]
  );

  const copyAI = useCallback(async () => {
    if (preview?.result.content) {
      await navigator.clipboard.writeText(preview.result.content);
    }
  }, [preview]);

  const closePreview = useCallback(() => setPreview(undefined), []);

  const regeneratePreview = useCallback(() => {
    if (preview) {
      void runAI(preview.task);
    }
  }, [preview, runAI]);

  const useServerVersion = useCallback(async () => {
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
  }, [conflictChapter, chapterId]);

  const overwriteServer = useCallback(async () => {
    await persist({
      nextTitle: titleRef.current,
      nextContent: contentRef.current,
      source: "manual_save",
      createVersion: true,
      sourceLabel: "冲突覆盖保存",
      force: true
    });
  }, [persist]);

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
  const smartTags = useMemo(() => buildSmartTags(bundle, title), [bundle, title]);

  return {
    loading,
    error,
    bundle,
    activeChapter,
    versions,
    diffBlocks,
    latestVersion,
    previousVersion,
    title,
    content,
    currentWordCount,
    syncStatus,
    saving,
    runningTask,
    preview,
    conflictChapter,
    activeCharacter,
    importantWorld,
    nextOutline,
    smartTags,
    textareaRef,
    updateTitle,
    updateContent,
    onSelect,
    manualSave,
    createChapter,
    runAI,
    applyAI,
    copyAI,
    closePreview,
    regeneratePreview,
    useServerVersion,
    overwriteServer
  };
}
