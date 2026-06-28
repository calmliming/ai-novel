"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import type { CharacterProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CharacterForm({
  onSubmit,
  initialValue
}: {
  onSubmit: (value: Partial<CharacterProfile> & { name: string }) => Promise<void>;
  initialValue?: CharacterProfile;
}) {
  const [value, setValue] = useState({
    id: initialValue?.id,
    name: initialValue?.name ?? "",
    role: initialValue?.role ?? "",
    personality: initialValue?.personality ?? "",
    motivation: initialValue?.motivation ?? "",
    speechStyle: initialValue?.speechStyle ?? "",
    relationshipNotes: initialValue?.relationshipNotes ?? ""
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!value.name.trim()) {
      return;
    }

    setSaving(true);

    try {
      await onSubmit(value);

      if (!initialValue) {
        setValue({
          id: undefined,
          name: "",
          role: "",
          personality: "",
          motivation: "",
          speechStyle: "",
          relationshipNotes: ""
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          value={value.name}
          onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))}
          placeholder="角色名"
        />
        <Input
          value={value.role}
          onChange={(event) => setValue((current) => ({ ...current, role: event.target.value }))}
          placeholder="定位"
        />
      </div>
      <Textarea
        rows={3}
        value={value.personality}
        onChange={(event) =>
          setValue((current) => ({ ...current, personality: event.target.value }))
        }
        placeholder="性格"
      />
      <Textarea
        rows={3}
        value={value.motivation}
        onChange={(event) =>
          setValue((current) => ({ ...current, motivation: event.target.value }))
        }
        placeholder="目标 / 动机"
      />
      <Textarea
        rows={3}
        value={value.speechStyle}
        onChange={(event) =>
          setValue((current) => ({ ...current, speechStyle: event.target.value }))
        }
        placeholder="说话方式"
      />
      <Textarea
        rows={3}
        value={value.relationshipNotes}
        onChange={(event) =>
          setValue((current) => ({ ...current, relationshipNotes: event.target.value }))
        }
        placeholder="关系备注"
      />
      <Button type="submit" disabled={saving}>
        <Save className="h-4 w-4" aria-hidden="true" />
        保存角色
      </Button>
    </form>
  );
}
