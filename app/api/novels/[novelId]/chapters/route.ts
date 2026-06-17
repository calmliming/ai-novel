import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import { createChapter, listChapters } from "@/server/services/chapter.service";

const createChapterSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  summary: z.string().optional(),
  volumeId: z.string().optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    return json({ chapters: await listChapters(novelId) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const input = createChapterSchema.parse(await request.json());
    const chapter = await createChapter(novelId, input);
    return chapter ? json({ chapter }, { status: 201 }) : notFound("Novel not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
