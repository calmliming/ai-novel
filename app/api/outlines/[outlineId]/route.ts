import { handleRouteError, json, notFound } from "@/server/http";
import { deleteOutline } from "@/server/services/lore.service";

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
