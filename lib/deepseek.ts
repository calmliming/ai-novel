import type { ChatMessage } from "@/lib/types";

type DeepSeekModel = "deepseek-v4-pro" | "deepseek-v4-flash" | string;

export async function callDeepSeek(params: {
  model: DeepSeekModel;
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
}) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured.");
  }

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.8,
      stream: params.stream ?? false
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek API error: ${errorText}`);
  }

  return res.json();
}

export async function callDeepSeekStream(params: {
  model: DeepSeekModel;
  messages: ChatMessage[];
  temperature?: number;
}) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured.");
  }

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.8,
      stream: true
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek API error: ${errorText}`);
  }

  if (!res.body) {
    throw new Error("DeepSeek stream response body is empty.");
  }

  return res.body;
}
