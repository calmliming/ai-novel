import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import {
  createVersionFromCurrentChapter,
  listChapterVersions
} from "@/server/services/version.service";

const schema = z.object({
  source: z
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
  sourceLabel: z.string().optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    return json({ versions: await listChapterVersions(chapterId) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const input = schema.parse(await request.json());
    const version = await createVersionFromCurrentChapter(
      chapterId,
      input.source,
      input.sourceLabel
    );
    return version ? json({ version }, { status: 201 }) : notFound("Chapter not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
