"use client";

import { openDB, type DBSchema } from "idb";
import type { LocalDraft } from "@/lib/types";

const DB_NAME = "ai-novel-writer";
const DB_VERSION = 1;
const DRAFT_STORE = "drafts";

interface NovelWriterDb extends DBSchema {
  drafts: {
    key: string;
    value: LocalDraft;
    indexes: {
      byNovel: string;
      byStatus: string;
    };
  };
}

async function getDatabase() {
  return openDB<NovelWriterDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        const draftStore = db.createObjectStore(DRAFT_STORE, {
          keyPath: "chapterId"
        });
        draftStore.createIndex("byNovel", "novelId");
        draftStore.createIndex("byStatus", "syncStatus");
      }
    }
  });
}

export async function saveLocalDraft(draft: LocalDraft) {
  const db = await getDatabase();
  await db.put(DRAFT_STORE, draft);
}

export async function getLocalDraft(chapterId: string) {
  const db = await getDatabase();
  return db.get(DRAFT_STORE, chapterId);
}

export async function deleteLocalDraft(chapterId: string) {
  const db = await getDatabase();
  await db.delete(DRAFT_STORE, chapterId);
}

export async function markDraftSynced(chapterId: string, versionNo: number) {
  const draft = await getLocalDraft(chapterId);

  if (!draft) {
    return;
  }

  await saveLocalDraft({
    ...draft,
    baseVersionNo: versionNo,
    syncedAt: new Date().toISOString(),
    syncStatus: "synced"
  });
}

