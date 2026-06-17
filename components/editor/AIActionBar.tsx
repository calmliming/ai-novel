"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { History, PenLine, Scissors, Sparkles, Wand2 } from "lucide-react";
import type { AIWriteTask } from "@/lib/types";
import { Button } from "@/components/ui/button";

const actions: Array<{
  task: AIWriteTask;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { task: "continue", label: "续写", icon: Sparkles },
  { task: "polish", label: "润色", icon: Wand2 },
  { task: "rewrite", label: "改写", icon: PenLine },
  { task: "shorten", label: "缩写", icon: Scissors }
];

export function AIActionBar({
  novelId,
  chapterId,
  onRun,
  runningTask
}: {
  novelId: string;
  chapterId: string;
  onRun: (task: AIWriteTask) => void;
  runningTask?: AIWriteTask;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-paper/95 px-2 py-2 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.task}
              variant={runningTask === action.task ? "primary" : "secondary"}
              className="h-12 flex-col gap-1 px-1 text-xs"
              onClick={() => onRun(action.task)}
              disabled={Boolean(runningTask)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </Button>
          );
        })}
        <Link
          href={`/novels/${novelId}/chapters/${chapterId}/history`}
          className="focus-ring inline-flex h-12 flex-col items-center justify-center gap-1 rounded-md border border-black/10 bg-white px-1 text-xs font-medium text-ink"
        >
          <History className="h-4 w-4" aria-hidden="true" />
          历史
        </Link>
      </div>
    </div>
  );
}
