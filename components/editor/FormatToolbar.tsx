"use client";

import { memo } from "react";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline
} from "lucide-react";

const icons = [AlignLeft, Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignCenter];

/** Decorative formatting rail (controls are placeholders). Hidden below md. */
export const FormatToolbar = memo(function FormatToolbar({ wordCount }: { wordCount: number }) {
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
});
