"use client";

import type { DiffBlock as DiffBlockType } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { DiffBlock } from "@/components/diff/DiffBlock";

export function DiffViewer({
  blocks,
  changesOnly
}: {
  blocks: DiffBlockType[];
  changesOnly: boolean;
}) {
  const visibleBlocks = changesOnly ? blocks.filter((block) => block.type !== "same") : blocks;

  if (!visibleBlocks.length) {
    return <EmptyState title="没有差异" description="这两个版本的正文一致。" />;
  }

  return (
    <div className="grid gap-3">
      {visibleBlocks.map((block, index) => (
        <DiffBlock key={`${block.type}-${block.paragraphIndex}-${index}`} block={block} />
      ))}
    </div>
  );
}

