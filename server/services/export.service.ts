import type { NovelBundle } from "@/lib/types";

export function renderNovelAsText(bundle: NovelBundle) {
  return [
    bundle.novel.title,
    bundle.novel.genre ? `类型：${bundle.novel.genre}` : undefined,
    bundle.novel.synopsis ? `简介：${bundle.novel.synopsis}` : undefined,
    "",
    ...bundle.chapters.flatMap((chapter) => [
      chapter.title,
      "",
      chapter.content,
      "",
      ""
    ])
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export function renderNovelAsMarkdown(bundle: NovelBundle) {
  return [
    `# ${bundle.novel.title}`,
    bundle.novel.genre ? `> 类型：${bundle.novel.genre}` : undefined,
    bundle.novel.synopsis ? `\n${bundle.novel.synopsis}` : undefined,
    "",
    "## 角色",
    ...bundle.characters.map(
      (character) =>
        `- **${character.name}**${character.role ? `（${character.role}）` : ""}：${
          character.personality || character.background || ""
        }`
    ),
    "",
    "## 世界观",
    ...bundle.worldSettings.map((setting) => `- **${setting.title}**：${setting.content}`),
    "",
    ...bundle.chapters.flatMap((chapter) => [
      `## ${chapter.title}`,
      "",
      chapter.content,
      ""
    ])
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

