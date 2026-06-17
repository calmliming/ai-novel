"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerSide = "left" | "right" | "bottom";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title?: string;
  /** Tailwind width class for left/right drawers (ignored for bottom). */
  widthClass?: string;
  /** Tailwind max-height class for bottom drawers. */
  heightClass?: string;
  children: React.ReactNode;
};

const ANIMATION_MS = 220;

const panelBase: Record<DrawerSide, string> = {
  left: "inset-y-0 left-0 h-full -translate-x-full pl-[env(safe-area-inset-left)]",
  right: "inset-y-0 right-0 h-full translate-x-full pr-[env(safe-area-inset-right)]",
  bottom:
    "inset-x-0 bottom-0 w-full translate-y-full rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
};

const panelOpen: Record<DrawerSide, string> = {
  left: "data-[state=open]:translate-x-0",
  right: "data-[state=open]:translate-x-0",
  bottom: "data-[state=open]:translate-y-0"
};

/**
 * Tailwind-only slide-over. Keeps the node mounted while animating out so the
 * exit transition is visible, locks body scroll, traps focus, and closes on
 * Escape / backdrop click. Used for the editor's mobile chapter / AI / version
 * panels so they share the exact same content as their desktop panes.
 */
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  widthClass = "w-[min(420px,86vw)]",
  heightClass = "max-h-[80dvh]",
  children
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [present, setPresent] = useState(open);
  const [active, setActive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // Drive mount/animate lifecycle from the `open` prop.
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement;
      setPresent(true);
      const raf = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(raf);
    }

    setActive(false);
    const timer = window.setTimeout(() => setPresent(false), ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Lock body scroll while present.
  useEffect(() => {
    if (!present) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [present]);

  // Move focus into the panel on open, restore it on close.
  useEffect(() => {
    if (active) {
      panelRef.current?.focus();
      return;
    }

    if (lastFocused.current instanceof HTMLElement) {
      lastFocused.current.focus();
    }
  }, [active]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      );

      if (!focusables || focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!mounted || !present) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50" aria-hidden={!active}>
      <button
        type="button"
        aria-label="关闭面板"
        onClick={onClose}
        data-state={active ? "open" : "closed"}
        className="absolute inset-0 bg-slate-950/40 opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "面板"}
        tabIndex={-1}
        data-state={active ? "open" : "closed"}
        onKeyDown={onKeyDown}
        className={cn(
          "absolute flex flex-col bg-white shadow-2xl outline-none transition-transform duration-200 ease-out",
          panelBase[side],
          panelOpen[side],
          side === "bottom" ? cn("h-auto", heightClass) : widthClass
        )}
      >
        {title ? (
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h2 id={titleId} className="text-sm font-semibold text-slate-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
