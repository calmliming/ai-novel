import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import { reorderChapters } from "@/server/services/chapter.service";

const schema = z.object({
  orderedIds: z.array(z.string()).min(1)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const input = schema.parse(await request.json());
    const chapters = await reorderChapters(novelId, input.orderedIds);
    return chapters ? json({ chapters }) : notFound("Chapters not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
