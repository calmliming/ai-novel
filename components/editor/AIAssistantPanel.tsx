"use client";

import { memo } from "react";
import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  ChevronUp,
  FileText,
  Layers3,
  Loader2,
  MessageSquareText,
  Sparkles,
  Tags
} from "lucide-react";
import type {
  AIWriteTask,
  CharacterProfile,
  OutlineItem,
  WorldSetting
} from "@/lib/types";

type AIAssistantProps = {
  character?: CharacterProfile;
  worldSetting?: WorldSetting;
  outline?: OutlineItem;
  tags: string[];
  onRun: (task: AIWriteTask) => void;
  onOpenAgent: () => void;
  runningTask?: AIWriteTask;
};

/** Container-agnostic assistant content, shared by desktop pane + mobile drawer. */
export function AIAssistantContent({
  character,
  worldSetting,
  outline,
  tags,
  onRun,
  onOpenAgent,
  runningTask
}: AIAssistantProps) {
  return (
    <div className="px-5 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">AI 助手</h2>
        </div>
        <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </div>

      <div className="grid gap-4">
        <AssistantCard
          title="Agent 对话"
          icon={MessageSquareText}
          actionLabel="打开对话"
          onAction={onOpenAgent}
        >
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-lg bg-slate-50 px-3 py-2">剧情推进</span>
            <span className="rounded-lg bg-slate-50 px-3 py-2">人物动机</span>
            <span className="rounded-lg bg-slate-50 px-3 py-2">伏笔回收</span>
            <span className="rounded-lg bg-slate-50 px-3 py-2">片段润色</span>
          </div>
        </AssistantCard>

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
              <span
                key={tag}
                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-blue-700"
              >
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
    </div>
  );
}

/** Desktop pane wrapper. */
export function AIAssistantPanel(props: AIAssistantProps) {
  return (
    <aside className="hidden h-full min-h-0 overflow-y-auto bg-white xl:block">
      <AIAssistantContent {...props} />
    </aside>
  );
}

const AssistantCard = memo(function AssistantCard({
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
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-medium text-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
});
