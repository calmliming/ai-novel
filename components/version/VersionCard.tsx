"use client";

import Link from "next/link";
import { Clipboard, GitCompare } from "lucide-react";
import type { ChapterVersion } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { RollbackButton } from "@/components/version/RollbackButton";
import { formatDateTime, truncateText, versionSourceLabel } from "@/lib/utils";

export function VersionCard({
  novelId,
  version,
  onRolledBack
}: {
  novelId: string;
  version: ChapterVersion;
  onRolledBack: () => void;
}) {
  async function copyContent() {
    await navigator.clipboard.writeText(version.content);
  }

  return (
    <Surface className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{versionSourceLabel(version.source)}</Badge>
            <Badge>v{version.versionNo}</Badge>
            <Badge>{version.wordCount} 字</Badge>
          </div>
          <p className="mt-2 text-sm text-black/55">{formatDateTime(version.createdAt)}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-black/70">
            {truncateText(version.content.replace(/\s+/g, " "), 180)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/novels/${novelId}/chapters/${version.chapterId}/diff?to=${version.id}`}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-ink"
          >
            <GitCompare className="h-4 w-4" aria-hidden="true" />
            对比
          </Link>
          <Button variant="secondary" onClick={copyContent}>
            <Clipboard className="h-4 w-4" aria-hidden="true" />
            复制
          </Button>
          <RollbackButton
            chapterId={version.chapterId}
            versionId={version.id}
            onRolledBack={onRolledBack}
          />
        </div>
      </div>
    </Surface>
  );
}

