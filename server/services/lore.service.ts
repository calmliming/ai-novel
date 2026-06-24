import type { CharacterProfile, OutlineItem, WorldSetting } from "@/lib/types";
import {
  createId,
  mutateDatabase,
  nowIso,
  readDatabase
} from "@/server/data/database";

export async function listCharacters(novelId: string) {
  const database = await readDatabase();

  return database.characters
    .filter((character) => character.novelId === novelId)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export async function upsertCharacter(
  novelId: string,
  input: Partial<CharacterProfile> & { id?: string; name: string }
) {
  return mutateDatabase((database) => {
    const timestamp = nowIso();
    const existing = input.id
      ? database.characters.find((character) => character.id === input.id)
      : undefined;

    if (existing) {
      Object.assign(existing, {
        ...input,
        novelId,
        name: input.name.trim(),
        updatedAt: timestamp
      });
      return existing;
    }

    const character: CharacterProfile = {
      id: createId(),
      novelId,
      name: input.name.trim(),
      alias: input.alias,
      role: input.role,
      gender: input.gender,
      age: input.age,
      appearance: input.appearance,
      personality: input.personality,
      background: input.background,
      motivation: input.motivation,
      speechStyle: input.speechStyle,
      relationshipNotes: input.relationshipNotes,
      status: input.status ?? "active",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.characters.push(character);
    return character;
  });
}

export async function updateCharacter(
  characterId: string,
  input: Partial<CharacterProfile> & { name: string }
) {
  return mutateDatabase((database) => {
    const existing = database.characters.find((character) => character.id === characterId);

    if (!existing) {
      return null;
    }

    Object.assign(existing, {
      ...input,
      id: characterId,
      novelId: existing.novelId,
      name: input.name.trim(),
      status: input.status ?? existing.status,
      updatedAt: nowIso()
    });

    return existing;
  });
}

export async function deleteCharacter(characterId: string) {
  return mutateDatabase((database) => {
    const exists = database.characters.some((character) => character.id === characterId);
    database.characters = database.characters.filter((character) => character.id !== characterId);
    return exists;
  });
}

export async function listWorldSettings(novelId: string) {
  const database = await readDatabase();

  return database.worldSettings
    .filter((setting) => setting.novelId === novelId)
    .sort((a, b) => b.importance - a.importance);
}

export async function upsertWorldSetting(
  novelId: string,
  input: Partial<WorldSetting> & { id?: string; title: string; content: string }
) {
  return mutateDatabase((database) => {
    const timestamp = nowIso();
    const existing = input.id
      ? database.worldSettings.find((setting) => setting.id === input.id)
      : undefined;

    if (existing) {
      Object.assign(existing, {
        ...input,
        novelId,
        title: input.title.trim(),
        content: input.content.trim(),
        category: input.category || "设定",
        importance: Number(input.importance ?? existing.importance),
        updatedAt: timestamp
      });
      return existing;
    }

    const setting: WorldSetting = {
      id: createId(),
      novelId,
      category: input.category || "设定",
      title: input.title.trim(),
      content: input.content.trim(),
      importance: Number(input.importance ?? 3),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.worldSettings.push(setting);
    return setting;
  });
}

export async function updateWorldSetting(
  settingId: string,
  input: Partial<WorldSetting> & { title: string; content: string }
) {
  return mutateDatabase((database) => {
    const existing = database.worldSettings.find((setting) => setting.id === settingId);

    if (!existing) {
      return null;
    }

    Object.assign(existing, {
      ...input,
      id: settingId,
      novelId: existing.novelId,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category || existing.category || "设定",
      importance: Number(input.importance ?? existing.importance),
      updatedAt: nowIso()
    });

    return existing;
  });
}

export async function deleteWorldSetting(settingId: string) {
  return mutateDatabase((database) => {
    const exists = database.worldSettings.some((setting) => setting.id === settingId);
    database.worldSettings = database.worldSettings.filter((setting) => setting.id !== settingId);
    return exists;
  });
}

export async function upsertOutline(
  novelId: string,
  input: Partial<OutlineItem> & { id?: string; content: string }
) {
  return mutateDatabase((database) => {
    const timestamp = nowIso();
    const existing = input.id ? database.outlines.find((outline) => outline.id === input.id) : undefined;

    if (existing) {
      Object.assign(existing, {
        ...input,
        novelId,
        content: input.content.trim(),
        updatedAt: timestamp
      });
      return existing;
    }

    const outline: OutlineItem = {
      id: createId(),
      novelId,
      volumeId: input.volumeId,
      chapterId: input.chapterId,
      type: input.type ?? "plot",
      title: input.title,
      content: input.content.trim(),
      orderIndex: Number(input.orderIndex ?? database.outlines.length),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.outlines.push(outline);
    return outline;
  });
}

export async function updateOutline(
  outlineId: string,
  input: Partial<OutlineItem> & { content: string }
) {
  return mutateDatabase((database) => {
    const existing = database.outlines.find((outline) => outline.id === outlineId);

    if (!existing) {
      return null;
    }

    Object.assign(existing, {
      ...input,
      id: outlineId,
      novelId: existing.novelId,
      content: input.content.trim(),
      orderIndex: Number(input.orderIndex ?? existing.orderIndex),
      updatedAt: nowIso()
    });

    return existing;
  });
}

export async function deleteOutline(outlineId: string) {
  return mutateDatabase((database) => {
    const exists = database.outlines.some((outline) => outline.id === outlineId);
    database.outlines = database.outlines.filter((outline) => outline.id !== outlineId);
    return exists;
  });
}
