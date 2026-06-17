import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function compact<T>(items: Array<T | undefined | null | false>) {
  return items.filter(Boolean) as T[];
}

export function truncateText(text: string, length = 120) {
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}...`;
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function versionSourceLabel(source: string) {
  const labels: Record<string, string> = {
    manual_save: "手动保存",
    auto_save: "自动保存",
    ai_continue: "AI 续写",
    ai_rewrite: "AI 改写",
    ai_polish: "AI 润色",
    ai_expand: "AI 扩写",
    ai_shorten: "AI 缩写",
    rollback: "版本回滚",
    import: "导入"
  };

  return labels[source] ?? source;
}

export function ensureErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

