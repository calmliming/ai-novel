"use client";

import { Clipboard, RotateCcw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AIWriteTask } from "@/lib/types";

export function AIPreviewDrawer({
  task,
  content,
  onApply,
  onCopy,
  onClose,
  onRegenerate,
  applying
}: {
  task: AIWriteTask;
  content: string;
  onApply: (mode: "insert" | "replace" | "append") => void;
  onCopy: () => void;
  onClose: () => void;
  onRegenerate: () => void;
  applying: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[64px] z-40 mx-auto max-w-5xl px-3">
      <section className="max-h-[58vh] overflow-hidden rounded-lg border border-black/10 bg-white shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
          <p className="text-sm font-semibold text-ink">AI 结果 · {taskLabel(task)}</p>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="关闭 AI 预览">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="max-h-[32vh] overflow-auto whitespace-pre-wrap px-4 py-3 text-sm leading-7 text-black/75">
          {content}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-black/10 p-3 sm:grid-cols-5">
          <Button variant="primary" onClick={() => onApply("append")} disabled={applying}>
            <Send className="h-4 w-4" aria-hidden="true" />
            追加
          </Button>
          <Button variant="secondary" onClick={() => onApply("replace")} disabled={applying}>
            替换
          </Button>
          <Button variant="secondary" onClick={() => onApply("insert")} disabled={applying}>
            插入
          </Button>
          <Button variant="secondary" onClick={onRegenerate} disabled={applying}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            重来
          </Button>
          <Button variant="ghost" onClick={onCopy}>
            <Clipboard className="h-4 w-4" aria-hidden="true" />
            复制
          </Button>
        </div>
      </section>
    </div>
  );
}

function taskLabel(task: AIWriteTask) {
  const labels: Record<AIWriteTask, string> = {
    continue: "续写",
    rewrite: "改写",
    polish: "润色",
    expand: "扩写",
    shorten: "缩写",
    "generate-title": "标题",
    "generate-outline": "大纲",
    "check-consistency": "一致性"
  };

  return labels[task];
}

