"use client";

import { memo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Download,
  Loader2,
  Menu,
  Save,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartphoneIcon } from "@/components/editor/icons";
import { syncText } from "@/components/editor/constants";
import type { SyncStatus } from "@/lib/types";

type TopBarProps = {
  novelId: string;
  novelTitle: string;
  title: string;
  syncStatus: SyncStatus;
  saving: boolean;
  currentWordCount: number;
  totalWordCount: number;
  onManualSave: () => void;
  onOpenChapters: () => void;
};

export const TopBar = memo(function TopBar({
  novelId,
  novelTitle,
  title,
  syncStatus,
  saving,
  currentWordCount,
  totalWordCount,
  onManualSave,
  onOpenChapters
}: TopBarProps) {
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-slate-200 bg-white px-3 py-2 sm:gap-3 sm:px-4 lg:h-20 lg:px-7 lg:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Link
          href={`/novels/${novelId}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-50 sm:hidden"
          aria-label="返回作品"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={onOpenChapters}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="章节列表"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 text-sm text-slate-500">
          <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
            <span className="hidden shrink-0 truncate sm:inline">{novelTitle || "未命名小说"}</span>
            <span className="hidden shrink-0 sm:inline">/</span>
            <span className="min-w-0 truncate font-medium text-slate-700">
              {title || "未命名章节"}
            </span>
            <ChevronDown className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-4 whitespace-nowrap text-sm text-slate-500 min-[1800px]:flex">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <span>{syncText(syncStatus)}</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <span>本章字数：{currentWordCount.toLocaleString()}</span>
        <span>全文字数：{totalWordCount.toLocaleString()}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onManualSave}
          className="hidden h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:grid"
          aria-label="同步"
        >
          <Cloud className="h-4 w-4" aria-hidden="true" />
        </button>
        <Button
          onClick={onManualSave}
          disabled={saving}
          className="h-11 bg-blue-700 px-4 hover:bg-blue-800 sm:px-5"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">保存</span>
        </Button>
        <a
          href={`/api/novels/${novelId}/export?format=md`}
          className="hidden h-11 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 xl:flex"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          导出
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </a>
        <button
          type="button"
          disabled
          className="hidden h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-600 min-[1800px]:grid"
          aria-label="移动预览"
        >
          <SmartphoneIcon />
        </button>
        <button
          type="button"
          disabled
          className="hidden h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-600 min-[1800px]:grid"
          aria-label="主题"
        >
          <Sun className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
});
