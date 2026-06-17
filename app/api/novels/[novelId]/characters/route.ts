import { z } from "zod";
import { handleRouteError, json } from "@/server/http";
import { listCharacters, upsertCharacter } from "@/server/services/lore.service";

const schema = z.object({
  id: z.string().optional(),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    return json({ characters: await listCharacters(novelId) });
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
    const input = schema.parse(await request.json());
    return json({ character: await upsertCharacter(novelId, input) });
  } catch (error) {
    return handleRouteError(error);
  }
}
