"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import type { WorldSetting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function WorldSettingForm({
  onSubmit,
  initialValue
}: {
  onSubmit: (value: Partial<WorldSetting> & { title: string; content: string }) => Promise<void>;
  initialValue?: WorldSetting;
}) {
  const [value, setValue] = useState({
    id: initialValue?.id,
    category: initialValue?.category ?? "世界观",
    title: initialValue?.title ?? "",
    content: initialValue?.content ?? "",
    importance: initialValue?.importance ?? 3
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!value.title.trim() || !value.content.trim()) {
      return;
    }

    setSaving(true);

    try {
      await onSubmit(value);

      if (!initialValue) {
        setValue({
          id: undefined,
          category: "世界观",
          title: "",
          content: "",
          importance: 3
        });
      }
    } catch {
      // The parent surface renders the API error; keep the current form draft.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-[1fr_96px]">
        <Input
          value={value.title}
          onChange={(event) => setValue((current) => ({ ...current, title: event.target.value }))}
          placeholder="设定标题"
        />
        <Select
          value={value.importance}
          onChange={(event) =>
            setValue((current) => ({ ...current, importance: Number(event.target.value) }))
          }
          aria-label="重要性"
        >
          {[1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>
              {level} 级
            </option>
          ))}
        </Select>
      </div>
      <Input
        value={value.category}
        onChange={(event) => setValue((current) => ({ ...current, category: event.target.value }))}
        placeholder="分类"
      />
      <Textarea
        rows={4}
        value={value.content}
        onChange={(event) => setValue((current) => ({ ...current, content: event.target.value }))}
        placeholder="设定内容"
      />
      <Button type="submit" disabled={saving}>
        <Save className="h-4 w-4" aria-hidden="true" />
        保存设定
      </Button>
    </form>
  );
}
