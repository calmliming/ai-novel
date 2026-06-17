"use client";

import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { aiActions } from "@/components/editor/constants";
import { cn } from "@/lib/utils";
import type { AIWriteTask } from "@/lib/types";

type FloatingAIBarProps = {
  runningTask?: AIWriteTask;
  onRun: (task: AIWriteTask) => void;
};

export const FloatingAIBar = memo(function FloatingAIBar({
  runningTask,
  onRun
}: FloatingAIBarProps) {
  return (
    <div className="pointer-events-auto sticky bottom-4 mx-auto mt-6 flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-indigo-100 bg-white/95 p-2 shadow-[0_18px_45px_rgba(37,99,235,0.18)] backdrop-blur sm:bottom-6 sm:w-fit">
      {aiActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.task}
            type="button"
            onClick={() => onRun(action.task)}
            disabled={Boolean(runningTask)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-blue-700 transition hover:bg-indigo-50 disabled:opacity-50",
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
        className="grid h-11 w-11 shrink-0 cursor-not-allowed place-items-center rounded-xl text-slate-300"
        aria-label="更多 AI 功能"
      >
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
});
