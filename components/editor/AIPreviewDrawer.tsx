"use client";

import { Clipboard, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiTaskLabel } from "@/lib/labels";
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
    <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-5xl px-3 min-[1600px]:bottom-6">
      <section className="max-h-[58dvh] overflow-hidden rounded-lg border border-black/10 bg-white shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
          <p className="text-sm font-semibold text-ink">AI 结果 · {aiTaskLabel(task)}</p>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="关闭 AI 预览">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="max-h-[32dvh] overflow-auto whitespace-pre-wrap px-4 py-3 text-sm leading-7 text-black/75">
          {content}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-black/10 p-3 min-[520px]:grid-cols-5">
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
