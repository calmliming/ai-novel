"use client";

import { memo } from "react";
import { FileText, History, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileActionBarProps = {
  onOpenChapters: () => void;
  onOpenAssistant: () => void;
  onOpenVersions: () => void;
};

/**
 * Sticky bottom bar that exposes the panes hidden on small screens. Each button
 * only shows below the breakpoint where its desktop pane appears, so a tablet
 * at lg (chapter sidebar already visible) won't show a redundant 章节 trigger.
 * The whole bar disappears at min-[1600px] where every pane is present.
 */
export const MobileActionBar = memo(function MobileActionBar({
  onOpenChapters,
  onOpenAssistant,
  onOpenVersions
}: MobileActionBarProps) {
  return (
    <nav
      aria-label="面板导航"
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur min-[1600px]:hidden"
    >
      <ActionButton
        className="lg:hidden"
        icon={FileText}
        label="章节"
        onClick={onOpenChapters}
      />
      <ActionButton
        className="xl:hidden"
        icon={Sparkles}
        label="AI 助手"
        onClick={onOpenAssistant}
      />
      <ActionButton icon={History} label="版本" onClick={onOpenVersions} />
    </nav>
  );
});

function ActionButton({
  icon: Icon,
  label,
  onClick,
  className
}: {
  icon: typeof FileText;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:bg-slate-100",
        className
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label}
    </button>
  );
}
