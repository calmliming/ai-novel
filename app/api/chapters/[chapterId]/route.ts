import { z } from "zod";
import { conflict, handleRouteError, json, notFound } from "@/server/http";
import { deleteChapter, getChapter, updateChapter } from "@/server/services/chapter.service";

const updateChapterSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  status: z.enum(["draft", "reviewing", "finished"]).optional(),
  baseVersionNo: z.number().int(),
  createVersion: z.boolean().optional(),
  versionSource: z
    .enum([
      "manual_save",
      "auto_save",
      "ai_continue",
      "ai_rewrite",
      "ai_polish",
      "ai_expand",
      "ai_shorten",
      "rollback",
      "import"
    ])
    .optional(),
  sourceLabel: z.string().optional(),
  aiModel: z.string().optional(),
  aiJobId: z.string().optional(),
  promptSnapshot: z.string().optional(),
  force: z.boolean().optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const chapter = await getChapter(chapterId);
    return chapter ? json({ chapter }) : notFound("Chapter not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const input = updateChapterSchema.parse(await request.json());
    const result = await updateChapter(chapterId, input);

    if (!result) {
      return notFound("Chapter not found.");
    }

    if (result.status === "conflict") {
      return conflict({
        error: "version_conflict",
        serverChapter: result.serverChapter
      });
    }

    return json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const deleted = await deleteChapter(chapterId);
    return deleted ? json({ ok: true }) : notFound("Chapter not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
