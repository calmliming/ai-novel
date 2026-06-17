import { callDeepSeek, callDeepSeekStream } from "@/lib/deepseek";
import type { AIAgentRequest, AIAgentResponse, ChatMessage } from "@/lib/types";
import { compact, truncateText } from "@/lib/utils";
import { readDatabase } from "@/server/data/database";

const MODEL_BY_MODE = {
  fast: process.env.DEEPSEEK_FAST_MODEL || "deepseek-v4-flash",
  pro: process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro"
};

export async function runAIAgentChat(request: AIAgentRequest): Promise<AIAgentResponse> {
  const model = MODEL_BY_MODE[request.modelMode ?? "pro"];
  const messages = await buildAgentMessages(request);

  if (!process.env.DEEPSEEK_API_KEY) {
    return {
      content: createMockAgentReply(request),
      model,
      usage: {
        inputTokens: undefined,
        outputTokens: undefined
      }
    };
  }

  const response = await callDeepSeek({
    model,
    messages,
    temperature: 0.72
  });
  const content = response?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("DeepSeek returned empty agent response.");
  }

  return {
    content,
    model,
    usage: {
      inputTokens: response?.usage?.prompt_tokens,
      outputTokens: response?.usage?.completion_tokens
    }
  };
}

export async function runAIAgentChatStream(request: AIAgentRequest) {
  const model = MODEL_BY_MODE[request.modelMode ?? "pro"];
  const messages = await buildAgentMessages(request);

  if (!process.env.DEEPSEEK_API_KEY) {
    return createMockTextStream(createMockAgentReply(request));
  }

  const upstream = await callDeepSeekStream({
    model,
    messages,
    temperature: 0.72
  });

  return parseDeepSeekTextStream(upstream);
}

async function buildAgentMessages(request: AIAgentRequest): Promise<ChatMessage[]> {
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
    .slice(0, 10)
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
    .slice(0, 10)
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
    .map(
      (item) =>
        `【${item.title}】\n摘要：${item.summary || "暂无"}\n正文片段：${truncateText(
          item.content,
          800
        )}`
    )
    .join("\n\n");

  const chapterTitle = request.chapterTitle || chapter?.title || "未选择章节";
  const chapterContent = request.chapterContent ?? chapter?.content ?? "";
  const selectedText = request.selectedText?.trim();

  const systemPrompt = `你是一个中文小说创作 Agent，像对话助手一样与作者协作。
你的职责是帮助作者推演剧情、分析设定、设计角色动机、润色片段、检查矛盾，也可以在作者明确要求时输出可直接使用的正文。
优先依据给定小说上下文；不要推翻已有设定；不确定时说明你的判断依据；回答要具体、可执行、保持中文。
当作者明确要求生成、改写、续写、润色一段可写入正文的内容时，直接输出可写入的小说文本，减少解释和标题。`;

  const contextPrompt = `【小说信息】
标题：${novel.title}
类型：${novel.genre || "未设置"}
风格：${novel.style || "未设置"}
简介：${novel.synopsis || "未设置"}

【重要角色】
${characters || "暂无"}

【世界观设定】
${worldSettings || "暂无"}

【当前大纲】
${outlines || "暂无"}

【最近章节】
${recentChapters || "暂无"}

【当前章节】
标题：${chapterTitle}
正文：${truncateText(chapterContent, 12000)}

【作者当前选中文本】
${selectedText ? truncateText(selectedText, 4000) : "暂无"}`;

  const history: ChatMessage[] = request.messages.slice(-16).map((message) => ({
    role: message.role,
    content: truncateText(message.content, 6000)
  }));

  return [
    {
      role: "system",
      content: `${systemPrompt}\n\n${contextPrompt}`
    },
    ...history
  ];
}

function createMockAgentReply(request: AIAgentRequest) {
  const lastUserMessage =
    request.messages
      .slice()
      .reverse()
      .find((message) => message.role === "user")?.content ?? "继续聊聊当前章节";

  const selectedHint = request.selectedText?.trim()
    ? "我也会优先参考你当前选中的文本。"
    : "如果你选中一段正文再提问，我可以更精确地分析那一段。";

  return `我收到了：${lastUserMessage}

当前没有配置 DEEPSEEK_API_KEY，所以这里先返回本地 Agent 预览。${selectedHint}

可以从三个方向推进：
1. 明确这一幕的冲突核心，让人物必须做选择。
2. 把世界观规则藏进动作或对白里，不直接解释。
3. 在段尾留一个小反常，给下一段制造牵引。`;
}

function createMockTextStream(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.match(/[\s\S]{1,8}/g) ?? [text];
  let canceled = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        if (canceled) {
          return;
        }

        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 18));
      }

      controller.close();
    },
    cancel() {
      canceled = true;
    }
  });
}

function parseDeepSeekTextStream(upstream: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      let buffer = "";
      let closed = false;

      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      const processEvent = (eventText: string) => {
        for (const line of eventText.split(/\r?\n/)) {
          if (closed) {
            break;
          }

          if (!line.startsWith("data:")) {
            continue;
          }

          const data = line.slice(5).trim();

          if (!data || data === "[DONE]") {
            if (data === "[DONE]") {
              close();
            }

            continue;
          }

          const chunk = JSON.parse(data);
          const content = chunk?.choices?.[0]?.delta?.content;

          if (typeof content === "string" && content) {
            controller.enqueue(encoder.encode(content));
          }
        }
      };

      try {
        while (!closed) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const eventText of events) {
            processEvent(eventText);

            if (closed) {
              break;
            }
          }
        }

        buffer += decoder.decode();

        if (!closed && buffer.trim()) {
          processEvent(buffer);
        }

        close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    }
  });
}
