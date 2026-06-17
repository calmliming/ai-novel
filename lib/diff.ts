import { diffLines } from "diff";
import type { DiffBlock } from "@/lib/types";

export function createParagraphDiff(oldText: string, newText: string): DiffBlock[] {
  const parts = diffLines(normalizeParagraphs(oldText), normalizeParagraphs(newText));
  const blocks: DiffBlock[] = [];
  let paragraphIndex = 0;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const next = parts[index + 1];

    if (part.removed && next?.added) {
      blocks.push({
        type: "changed",
        oldText: part.value,
        newText: next.value,
        paragraphIndex
      });
      paragraphIndex += paragraphCount(next.value);
      index += 1;
      continue;
    }

    if (part.added) {
      blocks.push({
        type: "added",
        newText: part.value,
        paragraphIndex
      });
      paragraphIndex += paragraphCount(part.value);
      continue;
    }

    if (part.removed) {
      blocks.push({
        type: "removed",
        oldText: part.value,
        paragraphIndex
      });
      continue;
    }

    blocks.push({
      type: "same",
      oldText: part.value,
      newText: part.value,
      paragraphIndex
    });
    paragraphIndex += paragraphCount(part.value);
  }

  return blocks;
}

function normalizeParagraphs(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function paragraphCount(text: string) {
  const normalized = normalizeParagraphs(text);

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\n{2,}/).length;
}

