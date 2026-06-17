import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import { rollbackChapterToVersion } from "@/server/services/version.service";

const schema = z.object({
  versionId: z.string().min(1)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const input = schema.parse(await request.json());
    const result = await rollbackChapterToVersion(chapterId, input.versionId);
    return result ? json(result) : notFound("Chapter or version not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
