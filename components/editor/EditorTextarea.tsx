"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const EditorTextarea = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (value: string) => void;
    onSelectText: (selection: { start: number; end: number; text: string }) => void;
  }
>(function EditorTextarea({ value, onChange, onSelectText }, ref) {
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onSelect={(event) => {
        const target = event.currentTarget;
        onSelectText({
          start: target.selectionStart,
          end: target.selectionEnd,
          text: target.value.slice(target.selectionStart, target.selectionEnd)
        });
      }}
      spellCheck={false}
      className={cn(
        "min-h-[calc(100vh-190px)] w-full border-0 bg-transparent px-4 py-5 text-[17px] leading-8 text-ink outline-none",
        "placeholder:text-black/30 md:min-h-[calc(100vh-150px)] md:px-8 md:text-[18px] md:leading-9"
      )}
      placeholder="开始写正文..."
    />
  );
});

