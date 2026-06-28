"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { AgentChatDialog } from "@/components/editor/AgentChatDialog";
import { AIPreviewDrawer } from "@/components/editor/AIPreviewDrawer";
import { AIAssistantContent, AIAssistantPanel } from "@/components/editor/AIAssistantPanel";
import { ChapterNavContent, ChapterSidebar } from "@/components/editor/ChapterNav";
import { FloatingAIBar } from "@/components/editor/FloatingAIBar";
import { FormatToolbar } from "@/components/editor/FormatToolbar";
import { MobileActionBar } from "@/components/editor/MobileActionBar";
import { PrimarySidebar } from "@/components/editor/PrimarySidebar";
import { TopBar } from "@/components/editor/TopBar";
import { BottomVersionPanel, VersionPanelContent } from "@/components/editor/VersionPanel";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useChapterWorkspace } from "@/components/editor/useChapterWorkspace";

type DrawerKey = "chapters" | "assistant" | "versions";

export function ChapterEditor({ novelId, chapterId }: { novelId: string; chapterId: string }) {
  const {
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
    selectedText,
    textareaRef,
    updateTitle,
    updateContent,
    onSelect,
    manualSave,
    createChapter,
    runAI,
    applyAI,
    applyAgentContent,
    copyAI,
    closePreview,
    regeneratePreview,
    useServerVersion,
    overwriteServer
  } = useChapterWorkspace(novelId, chapterId);
  const [openDrawer, setOpenDrawer] = useState<DrawerKey | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const closeDrawer = () => setOpenDrawer(null);

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[#f8fafc] text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[76px_236px_minmax(0,1fr)] min-[1440px]:grid-cols-[80px_244px_minmax(0,1fr)_312px] min-[1800px]:grid-cols-[188px_256px_minmax(0,1fr)_334px]">
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
            novelTitle={bundle?.novel.title ?? ""}
            title={title}
            syncStatus={syncStatus}
            saving={saving}
            currentWordCount={currentWordCount}
            totalWordCount={bundle?.novel.totalWordCount ?? currentWordCount}
            onManualSave={manualSave}
            onOpenChapters={() => setOpenDrawer("chapters")}
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
            <article className="mx-auto flex min-h-0 w-full max-w-[920px] flex-1 flex-col overflow-hidden px-4 py-5 pb-[88px] sm:px-6 md:px-8 lg:py-7 min-[1600px]:pb-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <input
                  value={title}
                  onChange={(event) => updateTitle(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[22px] font-semibold tracking-normal text-slate-950 outline-none sm:text-[26px] lg:text-[28px]"
                  placeholder="章节标题"
                />
                <Link
                  href={`/novels/${novelId}?tab=settings`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="章节设置"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => updateContent(event.target.value)}
                onSelect={onSelect}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent text-[16px] leading-[2.15] text-slate-800 outline-none placeholder:text-slate-300 sm:leading-[2.25] lg:text-[17px]"
                placeholder="开始写正文..."
              />

              <FloatingAIBar
                runningTask={runningTask}
                onRun={runAI}
                onOpenAgent={() => setAgentOpen(true)}
              />
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
          onOpenAgent={() => setAgentOpen(true)}
          runningTask={runningTask}
        />
      </div>

      <MobileActionBar
        onOpenChapters={() => setOpenDrawer("chapters")}
        onOpenAssistant={() => setOpenDrawer("assistant")}
        onOpenVersions={() => setOpenDrawer("versions")}
      />

      <Drawer
        open={openDrawer === "chapters"}
        onClose={closeDrawer}
        side="left"
        title="章节列表"
      >
        <ChapterNavContent
          novelId={novelId}
          chapterId={chapterId}
          bundle={bundle}
          activeChapter={activeChapter}
          onCreateChapter={createChapter}
          onNavigate={closeDrawer}
        />
      </Drawer>

      <Drawer
        open={openDrawer === "assistant"}
        onClose={closeDrawer}
        side="right"
        title="AI 助手"
      >
        <AIAssistantContent
          character={activeCharacter}
          worldSetting={importantWorld}
          outline={nextOutline}
          tags={smartTags}
          onRun={runAI}
          onOpenAgent={() => {
            setAgentOpen(true);
            closeDrawer();
          }}
          runningTask={runningTask}
        />
      </Drawer>

      <Drawer
        open={openDrawer === "versions"}
        onClose={closeDrawer}
        side="bottom"
        title="版本历史"
      >
        <VersionPanelContent
          novelId={novelId}
          chapterId={chapterId}
          versions={versions}
          diffBlocks={diffBlocks}
          latestVersion={latestVersion}
          previousVersion={previousVersion}
          onNavigate={closeDrawer}
        />
      </Drawer>

      {preview ? (
        <AIPreviewDrawer
          task={preview.task}
          content={preview.result.content}
          applying={saving}
          onApply={applyAI}
          onCopy={copyAI}
          onClose={closePreview}
          onRegenerate={regeneratePreview}
        />
      ) : null}

      <AgentChatDialog
        open={agentOpen}
        novelId={novelId}
        chapterId={chapterId}
        chapterTitle={title}
        chapterContent={content}
        selectedText={selectedText}
        applying={saving}
        onApplyContent={applyAgentContent}
        onClose={() => setAgentOpen(false)}
      />
    </div>
  );
}
