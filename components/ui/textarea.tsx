import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-7 text-slate-900 shadow-sm placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  );
}
