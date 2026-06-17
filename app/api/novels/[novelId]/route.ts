import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import { deleteNovel, getNovel, updateNovel } from "@/server/services/novel.service";

const updateNovelSchema = z.object({
  title: z.string().optional(),
  genre: z.string().optional(),
  style: z.string().optional(),
  synopsis: z.string().optional(),
  status: z.enum(["draft", "writing", "completed", "archived"]).optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const bundle = await getNovel(novelId);
    return bundle ? json(bundle) : notFound("Novel not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const input = updateNovelSchema.parse(await request.json());
    const novel = await updateNovel(novelId, input);
    return novel ? json({ novel }) : notFound("Novel not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const deleted = await deleteNovel(novelId);
    return deleted ? json({ ok: true }) : notFound("Novel not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
