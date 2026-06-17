import { z } from "zod";
import { handleRouteError, json } from "@/server/http";
import { listWorldSettings, upsertWorldSetting } from "@/server/services/lore.service";

const schema = z.object({
  id: z.string().optional(),
  category: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  importance: z.number().int().min(1).max(5).optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    return json({ worldSettings: await listWorldSettings(novelId) });
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
    return json({ worldSetting: await upsertWorldSetting(novelId, input) });
  } catch (error) {
    return handleRouteError(error);
  }
}
