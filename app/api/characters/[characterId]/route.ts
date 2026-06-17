import { handleRouteError, json, notFound } from "@/server/http";
import { deleteCharacter } from "@/server/services/lore.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const deleted = await deleteCharacter(characterId);
    return deleted ? json({ ok: true }) : notFound("Character not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
