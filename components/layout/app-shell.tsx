import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, LogIn, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveNav = "novels" | "login";

type AppShellProps = {
  children: ReactNode;
  active?: ActiveNav;
  sidebar?: ReactNode;
  sidebarLabel?: string;
  aside?: ReactNode;
  asideLabel?: string;
  header?: ReactNode;
  contentClassName?: string;
};

const navItems: Array<{
  href: string;
  label: string;
  active: ActiveNav;
  icon: typeof BookOpen;
}> = [
  { href: "/novels", label: "作品", active: "novels", icon: BookOpen },
  { href: "/login", label: "登录", active: "login", icon: LogIn }
];

export function AppShell({
  children,
  active = "novels",
  sidebar,
  sidebarLabel = "工作区侧栏",
  aside,
  asideLabel = "辅助信息",
  header,
  contentClassName
}: AppShellProps) {
  const hasSidebar = Boolean(sidebar);
  const hasAside = Boolean(aside);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <MobileHeader active={active} />
      <div
        className={cn(
          "grid min-h-[calc(100dvh-64px)] grid-cols-1 lg:h-screen lg:min-h-0 lg:overflow-hidden",
          hasSidebar && hasAside &&
            "lg:grid-cols-[76px_280px_minmax(0,1fr)] xl:grid-cols-[80px_292px_minmax(0,1fr)_320px] min-[1680px]:grid-cols-[208px_320px_minmax(0,1fr)_340px]",
          hasSidebar && !hasAside &&
            "lg:grid-cols-[76px_300px_minmax(0,1fr)] min-[1680px]:grid-cols-[208px_320px_minmax(0,1fr)]",
          !hasSidebar && hasAside &&
            "lg:grid-cols-[76px_minmax(0,1fr)] xl:grid-cols-[80px_minmax(0,1fr)_320px] min-[1680px]:grid-cols-[208px_minmax(0,1fr)_340px]",
          !hasSidebar && !hasAside &&
            "lg:grid-cols-[76px_minmax(0,1fr)] min-[1680px]:grid-cols-[208px_minmax(0,1fr)]"
        )}
      >
        <PrimaryNav active={active} />

        {sidebar ? (
          <aside
            aria-label={sidebarLabel}
            className="min-w-0 border-b border-slate-200 bg-white lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r"
          >
            {sidebar}
          </aside>
        ) : null}

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50">
          {header ? (
            <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
              {header}
            </header>
          ) : null}
          <main
            className={cn(
              "min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5 lg:px-6 lg:py-6",
              contentClassName
            )}
          >
            {children}
          </main>
        </section>

        {aside ? (
          <aside
            aria-label={asideLabel}
            className="hidden min-h-0 min-w-0 overflow-y-auto border-l border-slate-200 bg-white xl:block"
          >
            {aside}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function MobileHeader({ active }: { active: ActiveNav }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
      <Brand compact />
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-50",
                selected && "bg-indigo-50 text-blue-700"
              )}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function PrimaryNav({ active }: { active: ActiveNav }) {
  return (
    <aside className="hidden min-h-0 border-r border-slate-200 bg-white px-3 py-4 lg:flex lg:flex-col min-[1680px]:px-4">
      <Brand />
      <nav className="mt-8 grid gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 min-[1680px]:justify-start",
                selected && "bg-indigo-50 text-blue-700"
              )}
              aria-current={selected ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden min-[1680px]:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden rounded-lg border border-slate-200 bg-slate-50 p-3 min-[1680px]:block">
        <p className="text-xs font-medium text-slate-700">AI Novel</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">专注写作、设定与版本管理。</p>
      </div>
    </aside>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/novels"
      className={cn(
        "flex items-center gap-3 font-semibold text-slate-950",
        !compact && "justify-center min-[1680px]:justify-start"
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={cn("min-w-0", !compact && "hidden min-[1680px]:block")}>
        <span className="block truncate text-base leading-5">墨续 AI</span>
        <span className="block truncate text-xs font-normal text-slate-500">Moxu Writer</span>
      </span>
    </Link>
  );
}
