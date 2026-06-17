"use client";

import type { ChapterVersion } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { VersionCard } from "@/components/version/VersionCard";

export function VersionTimeline({
  novelId,
  versions,
  onRolledBack
}: {
  novelId: string;
  versions: ChapterVersion[];
  onRolledBack: () => void;
}) {
  if (!versions.length) {
    return <EmptyState title="暂无历史版本" description="手动保存、AI 写入或回滚后会生成版本。" />;
  }

  return (
    <div className="grid gap-3">
      {versions.map((version) => (
        <VersionCard
          key={version.id}
          novelId={novelId}
          version={version}
          onRolledBack={onRolledBack}
        />
      ))}
    </div>
  );
}

