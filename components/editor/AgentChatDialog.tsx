"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  Copy,
  FileInput,
  FilePlus,
  Loader2,
  type LucideIcon,
  MessageSquareText,
  Plus,
  RefreshCcw,
  Replace,
  Send,
  Trash2,
  X
} from "lucide-react";
import { getApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AIAgentChatMessage } from "@/lib/types";

type AgentChatDialogProps = {
  open: boolean;
  novelId: string;
  chapterId: string;
  chapterTitle: string;
  chapterContent: string;
  selectedText?: string;
  applying?: boolean;
  onApplyContent: (
    content: string,
    mode: "insert" | "replace" | "append" | "title" | "new-chapter"
  ) => Promise<void>;
  onClose: () => void;
};

const starterPrompts = [
  "帮我分析下一幕冲突",
  "检查这章人物动机",
  "给这段设计三个伏笔",
  "把当前选中文本润色得更有张力"
];

export function AgentChatDialog({
  open,
  novelId,
  chapterId,
  chapterTitle,
  chapterContent,
  selectedText,
  applying,
  onApplyContent,
  onClose
}: AgentChatDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<AIAgentChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);

    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    const node = scrollRef.current;

    if (!node) {
      return;
    }

    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const streamAgentReply = useCallback(
    async (nextMessages: AIAgentChatMessage[], rollbackMessages: AIAgentChatMessage[]) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const response = await fetch("/api/ai/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            novelId,
            chapterId,
            chapterTitle,
            chapterContent,
            selectedText,
            messages: nextMessages,
            modelMode: "pro"
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(await readAgentError(response));
        }

        if (!response.body) {
          throw new Error("Agent stream response body is empty.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          if (!chunk) {
            continue;
          }

          assistantContent += chunk;
          setMessages([
            ...nextMessages,
            {
              role: "assistant",
              content: assistantContent
            }
          ]);
        }

        const finalChunk = decoder.decode();

        if (finalChunk) {
          assistantContent += finalChunk;
          setMessages([
            ...nextMessages,
            {
              role: "assistant",
              content: assistantContent
            }
          ]);
        }

        if (!assistantContent.trim()) {
          throw new Error("Agent returned empty content.");
        }
      } catch (sendError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(getApiError(sendError));
        setMessages(rollbackMessages);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }

        setLoading(false);
      }
    },
    [
      chapterContent,
      chapterId,
      chapterTitle,
      novelId,
      selectedText
    ]
  );

  const sendMessage = useCallback(
    async (preset?: string) => {
      const text = (preset ?? input).trim();

      if (!text || loading) {
        return;
      }

      const previousMessages = messages;
      const nextMessages: AIAgentChatMessage[] = [
        ...messages,
        {
          role: "user",
          content: text
        }
      ];

      setMessages(nextMessages);
      setInput("");
      setError("");
      await streamAgentReply(nextMessages, previousMessages);
    },
    [input, loading, messages, streamAgentReply]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError("");
    setInput("");
  }, []);

  const regenerateLastResponse = useCallback(async () => {
    if (loading) {
      return;
    }

    const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");

    if (lastUserIndex < 0) {
      return;
    }

    const previousMessages = messages;
    const nextMessages = messages.slice(0, lastUserIndex + 1);

    setMessages(nextMessages);
    setError("");
    await streamAgentReply(nextMessages, previousMessages);
  }, [loading, messages, streamAgentReply]);

  const copyMessage = useCallback(async (content: string) => {
    await navigator.clipboard.writeText(content);
  }, []);

  const onInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  if (!mounted || !open) {
    return null;
  }

  const hasUserMessage = messages.some((message) => message.role === "user");
  const isStreamingMessage = loading && messages[messages.length - 1]?.role === "assistant";

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center px-3 py-3 sm:px-5 sm:py-5">
      <button
        type="button"
        aria-label="关闭 Agent 对话"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[min(780px,calc(100dvh-24px))] w-[min(760px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg bg-[#f8fafc] shadow-2xl outline-none"
      >
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-sm font-semibold text-slate-950">
                Agent 对话
              </h2>
              <p className="truncate text-xs text-slate-500">DeepSeek 写作协作</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={clearChat}
              title="清空"
              aria-label="清空对话"
              className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="关闭"
              aria-label="关闭"
              className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center py-10 text-center">
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                <MessageSquareText className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                今天想写哪一段？
              </h3>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "group max-w-[min(620px,84%)] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
                      message.role === "user"
                        ? "bg-blue-700 text-white"
                        : "border border-slate-200 bg-white text-slate-800"
                    )}
                  >
                    {message.content}
                    {message.role === "assistant" ? (
                      <div className="mt-3 flex flex-wrap justify-end gap-1.5">
                        <AgentApplyButton
                          icon={FileInput}
                          label="插入"
                          disabled={loading || applying || !message.content.trim()}
                          onClick={() => void onApplyContent(message.content, "insert")}
                        />
                        <AgentApplyButton
                          icon={Replace}
                          label={selectedText?.trim() ? "替换选区" : "替换全文"}
                          disabled={loading || applying || !message.content.trim()}
                          onClick={() => void onApplyContent(message.content, "replace")}
                        />
                        <AgentApplyButton
                          icon={Plus}
                          label="追加"
                          disabled={loading || applying || !message.content.trim()}
                          onClick={() => void onApplyContent(message.content, "append")}
                        />
                        <AgentApplyButton
                          icon={FileInput}
                          label="标题"
                          disabled={loading || applying || !message.content.trim()}
                          onClick={() => void onApplyContent(message.content, "title")}
                        />
                        <AgentApplyButton
                          icon={FilePlus}
                          label="新章"
                          disabled={loading || applying || !message.content.trim()}
                          onClick={() => void onApplyContent(message.content, "new-chapter")}
                        />
                        <button
                          type="button"
                          onClick={() => void copyMessage(message.content)}
                          title="复制"
                          aria-label="复制回复"
                          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 opacity-100 hover:bg-slate-100 hover:text-slate-700 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {loading && !isStreamingMessage ? (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    思考中
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {error ? (
          <div className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <footer className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
          <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              rows={2}
              placeholder="问 Agent..."
              className="max-h-36 min-h-[48px] w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between gap-3 px-1 pb-1">
              <div className="min-w-0 text-xs text-slate-500">
                {selectedText?.trim() ? (
                  <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                    已带入选中文本
                  </span>
                ) : (
                  <span>{chapterTitle || "当前章节"}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => void regenerateLastResponse()}
                  disabled={loading || !hasUserMessage}
                  title="重新生成"
                  aria-label="重新生成"
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={loading || !input.trim()}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  发送
                </button>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </div>,
    document.body
  );
}

function AgentApplyButton({
  icon: Icon,
  label,
  disabled,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-700 disabled:opacity-40"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

async function readAgentError(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const body = await response.json();

    if (body && typeof body === "object" && "error" in body) {
      return String((body as { error: unknown }).error);
    }

    return JSON.stringify(body);
  }

  return (await response.text()) || `Agent request failed with ${response.status}.`;
}
