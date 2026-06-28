"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Boxes,
  Clock3,
  Download,
  Edit3,
  FilePlus2,
  History,
  Loader2,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ChapterList } from "@/components/chapter/ChapterList";
import { CharacterForm } from "@/components/character/CharacterForm";
import { WorldSettingForm } from "@/components/world/WorldSettingForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getApiError } from "@/lib/api-client";
import type {
  CharacterProfile,
  Chapter,
  ChapterVersion,
  NovelBundle,
  OutlineItem,
  WorldSetting
} from "@/lib/types";
import { formatDateTime, versionSourceLabel } from "@/lib/utils";

type Tab = "chapters" | "outline" | "characters" | "world" | "history" | "settings";

const tabs: Array<{ id: Tab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "chapters", label: "章节", icon: BookOpen },
  { id: "outline", label: "大纲", icon: Sparkles },
  { id: "characters", label: "角色", icon: Users },
  { id: "world", label: "世界观", icon: Boxes },
  { id: "history", label: "历史", icon: History },
  { id: "settings", label: "设置", icon: Settings }
];

function toTab(value?: string): Tab {
  const allowed: Tab[] = ["chapters", "outline", "characters", "world", "history", "settings"];
  return allowed.includes(value as Tab) ? (value as Tab) : "chapters";
}

export function NovelDetailView({
  novelId,
  initialTab = "chapters"
}: {
  novelId: string;
  initialTab?: string;
}) {
  const [bundle, setBundle] = useState<NovelBundle | null>(null);
  const [tab, setTab] = useState<Tab>(toTab(initialTab));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [outlineContent, setOutlineContent] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    title: "",
    genre: "",
    style: "",
    synopsis: "",
    status: "writing"
  });

  const latestVersions = useMemo(() => bundle?.versions.slice(0, 20) ?? [], [bundle?.versions]);
  const currentTab = tabs.find((item) => item.id === tab);

  const loadBundle = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextBundle = await apiFetch<NovelBundle>(`/api/novels/${novelId}`);
      setBundle(nextBundle);
      setSettingsForm({
        title: nextBundle.novel.title,
        genre: nextBundle.novel.genre ?? "",
        style: nextBundle.novel.style ?? "",
        synopsis: nextBundle.novel.synopsis ?? "",
        status: nextBundle.novel.status
      });
    } catch (loadError) {
      setError(getApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    void loadBundle();
  }, [loadBundle]);

  async function createChapter(event: FormEvent) {
    event.preventDefault();

    if (!chapterTitle.trim()) {
      setError("请填写章节标题。");
      return;
    }

    try {
      const data = await apiFetch<{ chapter: Chapter }>(`/api/novels/${novelId}/chapters`, {
        method: "POST",
        body: JSON.stringify({ title: chapterTitle })
      });
      setChapterTitle("");
      await loadBundle();
      window.location.href = `/novels/${novelId}/chapters/${data.chapter.id}`;
    } catch (createError) {
      setError(getApiError(createError));
    }
  }

  async function deleteChapter(chapterId: string) {
    if (!window.confirm("删除后章节和对应历史版本都会移除，确定继续？")) {
      return;
    }

    try {
      await apiFetch(`/api/chapters/${chapterId}`, { method: "DELETE" });
      await loadBundle();
    } catch (deleteError) {
      setError(getApiError(deleteError));
    }
  }

  async function moveChapter(chapterId: string, direction: "up" | "down") {
    if (!bundle) {
      return;
    }

    const currentIndex = bundle.chapters.findIndex((chapter) => chapter.id === chapterId);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= bundle.chapters.length) {
      return;
    }

    const nextChapters = [...bundle.chapters];
    const [chapter] = nextChapters.splice(currentIndex, 1);
    nextChapters.splice(nextIndex, 0, chapter);

    try {
      await apiFetch(`/api/novels/${novelId}/chapters/reorder`, {
        method: "POST",
        body: JSON.stringify({ orderedIds: nextChapters.map((item) => item.id) })
      });
      await loadBundle();
    } catch (moveError) {
      setError(getApiError(moveError));
    }
  }

  async function saveCharacter(value: Partial<CharacterProfile> & { name: string }) {
    try {
      await apiFetch(value.id ? `/api/characters/${value.id}` : `/api/novels/${novelId}/characters`, {
        method: value.id ? "PATCH" : "POST",
        body: JSON.stringify(value)
      });
      setError("");
      await loadBundle();
    } catch (saveError) {
      setError(getApiError(saveError));
      throw saveError;
    }
  }

  async function saveWorldSetting(value: Partial<WorldSetting> & { title: string; content: string }) {
    try {
      await apiFetch(
        value.id ? `/api/world-settings/${value.id}` : `/api/novels/${novelId}/world-settings`,
        {
          method: value.id ? "PATCH" : "POST",
          body: JSON.stringify(value)
        }
      );
      setError("");
      await loadBundle();
    } catch (saveError) {
      setError(getApiError(saveError));
      throw saveError;
    }
  }

  async function saveOutline(event: FormEvent) {
    event.preventDefault();

    if (!outlineContent.trim()) {
      return;
    }

    try {
      await apiFetch(`/api/novels/${novelId}/outlines`, {
        method: "POST",
        body: JSON.stringify({
          type: "plot",
          title: `大纲 ${new Date().toLocaleDateString("zh-CN")}`,
          content: outlineContent,
          orderIndex: bundle?.outlines.length ?? 0
        })
      });
      setOutlineContent("");
      await loadBundle();
    } catch (outlineError) {
      setError(getApiError(outlineError));
    }
  }

  async function deleteItem(url: string) {
    try {
      await apiFetch(url, { method: "DELETE" });
      await loadBundle();
    } catch (deleteError) {
      setError(getApiError(deleteError));
    }
  }

  async function updateOutline(value: Partial<OutlineItem> & { id: string; content: string }) {
    try {
      await apiFetch(`/api/outlines/${value.id}`, {
        method: "PATCH",
        body: JSON.stringify(value)
      });
      setError("");
      await loadBundle();
    } catch (saveError) {
      setError(getApiError(saveError));
      throw saveError;
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();

    try {
      await apiFetch(`/api/novels/${novelId}`, {
        method: "PATCH",
        body: JSON.stringify(settingsForm)
      });
      await loadBundle();
    } catch (settingsError) {
      setError(getApiError(settingsError));
    }
  }

  if (loading) {
    return (
      <AppShell active="novels">
        <div className="grid min-h-72 place-items-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
      </AppShell>
    );
  }

  if (!bundle) {
    return (
      <AppShell active="novels">
        <EmptyState title="作品不存在" description={error || "没有找到对应作品。"} />
      </AppShell>
    );
  }

  const sidebar = (
    <div className="grid gap-6 p-4 lg:p-5">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 truncate text-xl font-semibold text-slate-950">{bundle.novel.title}</h1>
          <Badge>{bundle.novel.genre || "未设置类型"}</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-500">{bundle.novel.totalWordCount.toLocaleString()} 字</p>
        {bundle.novel.synopsis ? (
          <p className="mt-3 line-clamp-5 text-sm leading-6 text-slate-600">{bundle.novel.synopsis}</p>
        ) : null}
      </section>

      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`focus-ring flex h-11 shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-lg px-3 text-left text-sm font-medium transition lg:justify-start ${
                active ? "bg-indigo-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <section className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Export</p>
        <div className="grid grid-cols-3 gap-2">
          {["txt", "md", "json"].map((format) => (
            <a
              key={format}
              href={`/api/novels/${novelId}/export?format=${format}`}
              className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium uppercase text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {format}
            </a>
          ))}
        </div>
      </section>
    </div>
  );

  const aside = (
    <div className="grid gap-5 p-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Project</p>
        <h2 className="mt-2 text-base font-semibold text-slate-950">项目状态</h2>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <DetailMetric label="章节" value={bundle.chapters.length.toLocaleString()} />
        <DetailMetric label="大纲" value={bundle.outlines.length.toLocaleString()} />
        <DetailMetric label="角色" value={bundle.characters.length.toLocaleString()} />
        <DetailMetric label="设定" value={bundle.worldSettings.length.toLocaleString()} />
      </div>
      <section className="grid gap-3">
        <p className="text-sm font-semibold text-slate-900">最近版本</p>
        {latestVersions.slice(0, 5).length ? (
          latestVersions.slice(0, 5).map((version) => {
            const chapter = bundle.chapters.find((item) => item.id === version.chapterId);

            return (
              <Link
                key={version.id}
                href={chapter ? `/novels/${novelId}/chapters/${chapter.id}/history` : "#"}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Badge>v{version.versionNo}</Badge>
                  <span className="truncate text-slate-700">{chapter?.title || version.title}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {versionSourceLabel(version.source)} · {formatDateTime(version.createdAt)}
                </p>
              </Link>
            );
          })
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            暂无历史版本。
          </p>
        )}
      </section>
    </div>
  );

  return (
    <AppShell
      active="novels"
      sidebar={sidebar}
      sidebarLabel="作品导航"
      aside={aside}
      asideLabel="作品状态"
    >
      <div className="grid gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950">{currentTab?.label || "章节"}</p>
          <p className="mt-1 text-sm text-slate-500">管理当前作品的写作资料与版本。</p>
        </div>

        {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        {tab === "chapters" ? (
          <section className="grid gap-4 min-[1400px]:grid-cols-[320px_1fr]">
            <Surface className="p-4 min-[1400px]:self-start">
              <form className="grid gap-3" onSubmit={createChapter}>
                <Input
                  value={chapterTitle}
                  onChange={(event) => setChapterTitle(event.target.value)}
                  placeholder="章节标题"
                />
                <Button type="submit">
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  新建章节
                </Button>
              </form>
            </Surface>
            <ChapterList
              novelId={novelId}
              chapters={bundle.chapters}
              onDelete={deleteChapter}
              onMove={moveChapter}
            />
          </section>
        ) : null}

        {tab === "outline" ? (
          <section className="grid gap-4 min-[1400px]:grid-cols-[320px_1fr]">
            <Surface className="p-4 min-[1400px]:self-start">
              <form className="grid gap-3" onSubmit={saveOutline}>
                <Textarea
                  rows={8}
                  value={outlineContent}
                  onChange={(event) => setOutlineContent(event.target.value)}
                  placeholder="新增剧情大纲"
                />
                <Button type="submit">
                  <Save className="h-4 w-4" aria-hidden="true" />
                  保存大纲
                </Button>
              </form>
            </Surface>
            <OutlineList outlines={bundle.outlines} onSave={updateOutline} onDelete={deleteItem} />
          </section>
        ) : null}

        {tab === "characters" ? (
          <section className="grid gap-4 min-[1400px]:grid-cols-[360px_1fr]">
            <Surface className="p-4 min-[1400px]:self-start">
              <CharacterForm onSubmit={saveCharacter} />
            </Surface>
            <CharacterList characters={bundle.characters} onSave={saveCharacter} onDelete={deleteItem} />
          </section>
        ) : null}

        {tab === "world" ? (
          <section className="grid gap-4 min-[1400px]:grid-cols-[360px_1fr]">
            <Surface className="p-4 min-[1400px]:self-start">
              <WorldSettingForm onSubmit={saveWorldSetting} />
            </Surface>
            <WorldSettingList
              settings={bundle.worldSettings}
              onSave={saveWorldSetting}
              onDelete={deleteItem}
            />
          </section>
        ) : null}

        {tab === "history" ? (
          <VersionList versions={latestVersions} chapters={bundle.chapters} />
        ) : null}

        {tab === "settings" ? (
          <Surface className="max-w-2xl p-4">
            <form className="grid gap-3" onSubmit={saveSettings}>
              <Input
                value={settingsForm.title}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="作品标题"
              />
              <Input
                value={settingsForm.genre}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, genre: event.target.value }))
                }
                placeholder="类型"
              />
              <Input
                value={settingsForm.style}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, style: event.target.value }))
                }
                placeholder="写作风格"
              />
              <Textarea
                rows={5}
                value={settingsForm.synopsis}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, synopsis: event.target.value }))
                }
                placeholder="简介"
              />
              <Select
                value={settingsForm.status}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="draft">草稿</option>
                <option value="writing">连载中</option>
                <option value="completed">已完结</option>
                <option value="archived">归档</option>
              </Select>
              <Button type="submit">
                <Save className="h-4 w-4" aria-hidden="true" />
                保存设置
              </Button>
            </form>
          </Surface>
        ) : null}
      </div>
    </AppShell>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function OutlineList({
  outlines,
  onSave,
  onDelete
}: {
  outlines: OutlineItem[];
  onSave: (value: Partial<OutlineItem> & { id: string; content: string }) => Promise<void>;
  onDelete: (url: string) => void;
}) {
  if (!outlines.length) {
    return <EmptyState title="还没有大纲" description="保存剧情节点后会显示在这里。" />;
  }

  return (
    <div className="grid gap-3">
      {outlines.map((outline) => (
        <OutlineCard key={outline.id} outline={outline} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

function OutlineCard({
  outline,
  onSave,
  onDelete
}: {
  outline: OutlineItem;
  onSave: (value: Partial<OutlineItem> & { id: string; content: string }) => Promise<void>;
  onDelete: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    title: outline.title ?? "",
    type: outline.type,
    content: outline.content
  });

  function resetDraft() {
    setDraft({
      title: outline.title ?? "",
      type: outline.type,
      content: outline.content
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!draft.content.trim()) {
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: outline.id,
        title: draft.title,
        type: draft.type,
        content: draft.content,
        orderIndex: outline.orderIndex
      });
      setEditing(false);
    } catch {
      // The parent surface renders the API error; keep the current form draft.
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <Surface className="p-4">
        <form className="grid gap-3" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-ink">编辑大纲</p>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                resetDraft();
                setEditing(false);
              }}
              aria-label="取消编辑大纲"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px]">
            <Input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="大纲标题"
            />
            <Select
              value={draft.type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  type: event.target.value as OutlineItem["type"]
                }))
              }
              aria-label="大纲类型"
            >
              <option value="book">全书</option>
              <option value="volume">分卷</option>
              <option value="chapter">章节</option>
              <option value="plot">剧情</option>
            </Select>
          </div>
          <Textarea
            rows={6}
            value={draft.content}
            onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
            placeholder="大纲内容"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                resetDraft();
                setEditing(false);
              }}
            >
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              保存大纲
            </Button>
          </div>
        </form>
      </Surface>
    );
  }

  return (
    <Surface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{outline.title || "剧情节点"}</p>
            <Badge>{outlineTypeLabel(outline.type)}</Badge>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/65">{outline.content}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              resetDraft();
              setEditing(true);
            }}
            aria-label="编辑大纲"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(`/api/outlines/${outline.id}`)}
            aria-label="删除大纲"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Surface>
  );
}

function CharacterList({
  characters,
  onSave,
  onDelete
}: {
  characters: CharacterProfile[];
  onSave: (value: Partial<CharacterProfile> & { name: string }) => Promise<void>;
  onDelete: (url: string) => void;
}) {
  if (!characters.length) {
    return <EmptyState title="还没有角色" description="添加角色后，AI 续写会注入这些设定。" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {characters.map((character) => (
        <CharacterCard key={character.id} character={character} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

function CharacterCard({
  character,
  onSave,
  onDelete
}: {
  character: CharacterProfile;
  onSave: (value: Partial<CharacterProfile> & { name: string }) => Promise<void>;
  onDelete: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  async function saveCharacter(value: Partial<CharacterProfile> & { name: string }) {
    await onSave(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <Surface className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-semibold text-ink">编辑角色</p>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(false)}
            aria-label="取消编辑角色"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <CharacterForm initialValue={character} onSubmit={saveCharacter} />
      </Surface>
    );
  }

  return (
    <Surface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{character.name}</p>
          <p className="mt-1 text-sm text-black/55">{character.role || "未设置定位"}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            aria-label="编辑角色"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(`/api/characters/${character.id}`)}
            aria-label="删除角色"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-black/65">
        {character.personality || character.background || character.motivation || "暂无设定"}
      </p>
    </Surface>
  );
}

function WorldSettingList({
  settings,
  onSave,
  onDelete
}: {
  settings: WorldSetting[];
  onSave: (value: Partial<WorldSetting> & { title: string; content: string }) => Promise<void>;
  onDelete: (url: string) => void;
}) {
  if (!settings.length) {
    return <EmptyState title="还没有世界观设定" description="重要设定会进入 AI 上下文。" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {settings.map((setting) => (
        <WorldSettingCard key={setting.id} setting={setting} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
}

function WorldSettingCard({
  setting,
  onSave,
  onDelete
}: {
  setting: WorldSetting;
  onSave: (value: Partial<WorldSetting> & { title: string; content: string }) => Promise<void>;
  onDelete: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  async function saveWorldSetting(value: Partial<WorldSetting> & { title: string; content: string }) {
    await onSave(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <Surface className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-semibold text-ink">编辑设定</p>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(false)}
            aria-label="取消编辑设定"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <WorldSettingForm initialValue={setting} onSubmit={saveWorldSetting} />
      </Surface>
    );
  }

  return (
    <Surface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-ink">{setting.title}</p>
            <Badge>{setting.category}</Badge>
            <Badge>{setting.importance} 级</Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            aria-label="编辑设定"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(`/api/world-settings/${setting.id}`)}
            aria-label="删除设定"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-black/65">
        {setting.content}
      </p>
    </Surface>
  );
}

function outlineTypeLabel(type: OutlineItem["type"]) {
  const labels: Record<OutlineItem["type"], string> = {
    book: "全书",
    volume: "分卷",
    chapter: "章节",
    plot: "剧情"
  };

  return labels[type];
}

function VersionList({
  versions,
  chapters
}: {
  versions: ChapterVersion[];
  chapters: Chapter[];
}) {
  if (!versions.length) {
    return <EmptyState title="还没有历史版本" description="手动保存或 AI 写入后会生成版本。" />;
  }

  return (
    <div className="grid gap-3">
      {versions.map((version) => {
        const chapter = chapters.find((item) => item.id === version.chapterId);

        return (
          <Surface key={version.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{versionSourceLabel(version.source)}</Badge>
                  <Badge>v{version.versionNo}</Badge>
                  <Badge>{version.wordCount} 字</Badge>
                </div>
                <p className="mt-2 font-semibold text-ink">{chapter?.title || version.title}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-black/55">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {formatDateTime(version.createdAt)}
                </p>
              </div>
              {chapter ? (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/novels/${chapter.novelId}/chapters/${chapter.id}/history`}
                    className="focus-ring inline-flex h-10 items-center rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-ink"
                  >
                    查看
                  </Link>
                  <Link
                    href={`/novels/${chapter.novelId}/chapters/${chapter.id}/diff`}
                    className="focus-ring inline-flex h-10 items-center rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-ink"
                  >
                    对比
                  </Link>
                </div>
              ) : null}
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
