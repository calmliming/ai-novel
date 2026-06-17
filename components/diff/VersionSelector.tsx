"use client";

import type { ChapterVersion } from "@/lib/types";
import { Select } from "@/components/ui/select";
import { formatDateTime, versionSourceLabel } from "@/lib/utils";

export function VersionSelector({
  label,
  versions,
  value,
  onChange
}: {
  label: string;
  versions: ChapterVersion[];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-black/70">
      {label}
      <Select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        {versions.map((version) => (
          <option key={version.id} value={version.id}>
            v{version.versionNo} · {versionSourceLabel(version.source)} ·{" "}
            {formatDateTime(version.createdAt)}
          </option>
        ))}
      </Select>
    </label>
  );
}

