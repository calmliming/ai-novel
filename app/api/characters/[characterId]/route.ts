import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import { deleteCharacter, updateCharacter } from "@/server/services/lore.service";

const schema = z.object({
  name: z.string().min(1),
  alias: z.string().optional(),
  role: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  motivation: z.string().optional(),
  speechStyle: z.string().optional(),
  relationshipNotes: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const input = schema.parse(await request.json());
    const character = await updateCharacter(characterId, input);
    return character ? json({ character }) : notFound("Character not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}

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
