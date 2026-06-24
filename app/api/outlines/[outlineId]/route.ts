import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import { deleteOutline, updateOutline } from "@/server/services/lore.service";

const schema = z.object({
  volumeId: z.string().optional(),
  chapterId: z.string().optional(),
  type: z.enum(["book", "volume", "chapter", "plot"]).optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  orderIndex: z.number().int().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ outlineId: string }> }
) {
  try {
    const { outlineId } = await params;
    const input = schema.parse(await request.json());
    const outline = await updateOutline(outlineId, input);
    return outline ? json({ outline }) : notFound("Outline not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ outlineId: string }> }
) {
  try {
    const { outlineId } = await params;
    const deleted = await deleteOutline(outlineId);
    return deleted ? json({ ok: true }) : notFound("Outline not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
