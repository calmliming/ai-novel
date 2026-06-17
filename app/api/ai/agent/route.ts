import { z } from "zod";
import { handleRouteError } from "@/server/http";
import { runAIAgentChatStream } from "@/server/services/agent.service";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000)
});

const requestSchema = z.object({
  novelId: z.string().min(1),
  chapterId: z.string().optional(),
  chapterTitle: z.string().max(300).optional(),
  chapterContent: z.string().max(120000).optional(),
  selectedText: z.string().max(20000).optional(),
  messages: z.array(messageSchema).min(1).max(32),
  modelMode: z.enum(["fast", "pro"]).optional()
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const stream = await runAIAgentChatStream(input);

    return new Response(stream, {
      status: 201,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
