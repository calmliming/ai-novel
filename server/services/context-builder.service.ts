import type { AIWriteRequest, AIWriteTask, ChatMessage } from "@/lib/types";
import { compact, truncateText } from "@/lib/utils";
import { readDatabase } from "@/server/data/database";

export async function buildAIContext(task: AIWriteTask, request: AIWriteRequest) {
  const database = await readDatabase();
  const novel = database.novels.find((item) => item.id === request.novelId);
  const chapter = request.chapterId
    ? database.chapters.find((item) => item.id === request.chapterId)
    : undefined;

  if (!novel) {
    throw new Error("Novel not found.");
  }

  const characters = database.characters
    .filter((item) => item.novelId === novel.id && item.status === "active")
    .slice(0, 12)
    .map((character) =>
      compact([
        `姓名：${character.name}`,
        character.role ? `定位：${character.role}` : undefined,
        character.personality ? `性格：${character.personality}` : undefined,
        character.motivation ? `目标：${character.motivation}` : undefined,
        character.speechStyle ? `说话方式：${character.speechStyle}` : undefined,
        character.relationshipNotes ? `关系：${character.relationshipNotes}` : undefined
      ]).join("\n")
    )
    .join("\n\n");

  const worldSettings = database.worldSettings
    .filter((item) => item.novelId === novel.id)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 12)
    .map((setting) => `【${setting.category}】${setting.title}\n${setting.content}`)
    .join("\n\n");

  const outlines = database.outlines
    .filter((item) => item.novelId === novel.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .slice(0, 8)
    .map((outline) => `${outline.title ?? outline.type}：${outline.content}`)
    .join("\n");

  const recentChapters = database.chapters
    .filter((item) => item.novelId === novel.id && item.id !== chapter?.id)
    .sort((a, b) => b.orderIndex - a.orderIndex)
    .slice(0, 4)
    .reverse()
    .map(
      (item) =>
        `【${item.title}】\n摘要：${item.summary || "暂无"}\n正文片段：${truncateText(
          item.content,
          1000
        )}`
    )
    .join("\n\n");

  const systemPrompt =
    "你是一名专业中文网络小说作者、编辑和剧情策划。保持人物、世界观和剧情连续；不要推翻已有设定；不要重复已有内容；不要解释写作过程；直接输出可用正文或用户请求的结果；使用中文。";

  const userPrompt = renderTaskPrompt(task, {
    novelTitle: novel.title,
    genre: novel.genre,
    style: novel.style,
    synopsis: novel.synopsis,
    characters,
    worldSettings,
    outlines,
    recentChapters,
    chapterTitle: chapter?.title,
    chapterContent: chapter?.content,
    selectedText: request.selectedText,
    instruction: request.instruction,
    targetWords: request.targetWords
  });

  return {
    novel,
    chapter,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ] satisfies ChatMessage[]
  };
}

function renderTaskPrompt(
  task: AIWriteTask,
  context: {
    novelTitle: string;
    genre?: string;
    style?: string;
    synopsis?: string;
    characters: string;
    worldSettings: string;
    outlines: string;
    recentChapters: string;
    chapterTitle?: string;
    chapterContent?: string;
    selectedText?: string;
    instruction?: string;
    targetWords?: number;
  }
) {
  const base = `【小说信息】
标题：${context.novelTitle}
类型：${context.genre || "未设置"}
风格：${context.style || "未设置"}
简介：${context.synopsis || "未设置"}

【重要角色】
${context.characters || "暂无"}

【世界观设定】
${context.worldSettings || "暂无"}

【当前大纲】
${context.outlines || "暂无"}

【最近章节】
${context.recentChapters || "暂无"}

【当前章节】
标题：${context.chapterTitle || "未选择章节"}
正文：${context.chapterContent || "暂无"}
`;

  if (task === "continue") {
    return `${base}
【任务】
请从当前章节结尾自然续写 ${context.targetWords ?? 800} 字。

【要求】
1. 不要重复当前章节已有内容
2. 推动剧情向前发展
3. 保持原有文风
4. 结尾留下轻微悬念
5. 只输出正文`;
  }

  if (task === "rewrite") {
    return `【写作风格】
${context.style || "保持原文风格"}

【需要改写的文本】
${context.selectedText || ""}

【用户要求】
${context.instruction || "请在不改变原意的前提下改写。"}

【任务】
改写“需要改写的文本”。保持原意，不破坏前后衔接，不新增重大设定，只输出改写后的文本。`;
  }

  if (task === "polish") {
    return `【文本】
${context.selectedText || context.chapterContent || ""}

【任务】
润色这段小说文本。保持原意，提升画面感和节奏，不新增剧情，只输出润色后的文本。`;
  }

  if (task === "expand") {
    return `【文本】
${context.selectedText || context.chapterContent || ""}

【任务】
扩写这段文本到约 ${context.targetWords ?? 600} 字。增强细节、动作与情绪层次，不改变剧情方向，只输出扩写后的文本。`;
  }

  if (task === "shorten") {
    return `【文本】
${context.selectedText || context.chapterContent || ""}

【任务】
压缩这段文本，保留关键信息和情绪，只输出缩写后的文本。`;
  }

  if (task === "generate-title") {
    return `${base}
【任务】
为当前章节生成 8 个中文章节标题。每行一个，不要解释。`;
  }

  if (task === "generate-outline") {
    return `${base}
【任务】
基于当前信息生成接下来 5 章的大纲。每章包含标题、核心事件、情绪推进和悬念。`;
  }

  return `${base}
【任务】
检查当前章节是否存在人物、世界观、时间线、动机或前后情节不一致的问题。请用简洁条目输出。`;
}

