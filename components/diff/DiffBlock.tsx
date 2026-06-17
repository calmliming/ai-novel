"use client";

import type { DiffBlock as DiffBlockType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DiffBlock({ block }: { block: DiffBlockType }) {
  const text = (block.type === "removed" ? block.oldText : block.newText ?? block.oldText) ?? "";

  if (!text.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-3 text-sm leading-7",
        block.type === "same" && "border-black/5 bg-black/[0.03] text-black/55",
        block.type === "added" && "border-moss/20 bg-moss/10 text-ink",
        block.type === "removed" && "border-wine/20 bg-wine/10 text-wine line-through",
        block.type === "changed" && "border-brass/25 bg-brass/10 text-ink"
      )}
    >
      {block.type === "changed" ? (
        <div className="grid gap-2">
          <p className="whitespace-pre-wrap text-wine line-through">{block.oldText}</p>
          <p className="whitespace-pre-wrap">{block.newText}</p>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{text}</p>
      )}
    </div>
  );
}
