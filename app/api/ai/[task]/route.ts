import { z } from "zod";
import type { AIWriteTask } from "@/lib/types";
import { badRequest, handleRouteError, json } from "@/server/http";
import { runAIWriteTask } from "@/server/services/ai.service";

const taskSchema = z.enum([
  "continue",
  "rewrite",
  "polish",
  "expand",
  "shorten",
  "generate-title",
  "generate-outline",
  "check-consistency"
]);

const requestSchema = z.object({
  novelId: z.string().min(1),
  chapterId: z.string().optional(),
  selectedText: z.string().optional(),
  instruction: z.string().optional(),
  targetWords: z.number().int().positive().optional(),
  modelMode: z.enum(["fast", "pro"]).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ task: string }> }
) {
  try {
    const { task } = await params;
    const parsedTask = taskSchema.safeParse(task);

    if (!parsedTask.success) {
      return badRequest("Unsupported AI task.");
    }

    const input = requestSchema.parse(await request.json());
    const result = await runAIWriteTask(parsedTask.data as AIWriteTask, input);
    return json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
