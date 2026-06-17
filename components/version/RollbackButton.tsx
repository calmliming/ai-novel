"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export function RollbackButton({
  chapterId,
  versionId,
  onRolledBack
}: {
  chapterId: string;
  versionId: string;
  onRolledBack: () => void;
}) {
  async function rollback() {
    if (!window.confirm("回滚会把该版本内容写回当前章节，并生成新的历史版本。确定继续？")) {
      return;
    }

    await apiFetch(`/api/chapters/${chapterId}/rollback`, {
      method: "POST",
      body: JSON.stringify({ versionId })
    });
    onRolledBack();
  }

  return (
    <Button variant="secondary" onClick={rollback}>
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      回滚
    </Button>
  );
}

