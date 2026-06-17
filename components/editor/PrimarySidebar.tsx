"use client";

import Link from "next/link";
import { BookOpen, FileText, History, ListTree, Settings, Sparkles, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NovelBundle } from "@/lib/types";

type PrimarySidebarProps = {
  novelId: string;
  chapterId: string;
  bundle: NovelBundle | null;
};

/**
 * Slim icon rail shown on tablet/desktop (md+). Carries no fake account data —
 * the only number is the real total word count from the bundle.
 */
export function PrimarySidebar({ novelId, chapterId, bundle }: PrimarySidebarProps) {
  const items = [
    { label: "小说", icon: BookOpen, href: `/novels/${novelId}`, active: false },
    {
      label: "章节",
      icon: FileText,
      href: `/novels/${novelId}/chapters/${chapterId}`,
      active: true
    },
    { label: "大纲", icon: ListTree, href: `/novels/${novelId}?tab=outline`, active: false },
    { label: "角色", icon: Users, href: `/novels/${novelId}?tab=characters`, active: false },
    { label: "设定", icon: Settings, href: `/novels/${novelId}?tab=world`, active: false },
    {
      label: "历史",
      icon: History,
      href: `/novels/${novelId}/chapters/${chapterId}/history`,
      active: false
    },
    { label: "我的", icon: User, href: "/login", active: false }
  ];

  const totalWordCount = bundle?.novel.totalWordCount ?? 0;

  return (
    <aside className="hidden h-full min-h-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 md:flex md:flex-col min-[1800px]:px-4 min-[1800px]:py-5">
      <Link
        href="/novels"
        className="flex items-center justify-center gap-3 min-[1800px]:justify-start"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="hidden min-[1800px]:block">
          <span className="block text-lg font-semibold leading-5 text-slate-950">墨续 AI</span>
          <span className="text-xs text-slate-500">Moxu Writer</span>
        </span>
      </Link>

      <nav className="mt-9 grid gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition min-[1800px]:justify-start",
                item.active
                  ? "bg-indigo-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="hidden min-[1800px]:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-slate-200 pt-4 min-[1800px]:block">
        <p className="text-xs font-medium text-slate-700">全文字数</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {totalWordCount.toLocaleString()}
        </p>
      </div>
    </aside>
  );
}
