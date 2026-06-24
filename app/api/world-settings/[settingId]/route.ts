import { z } from "zod";
import { handleRouteError, json, notFound } from "@/server/http";
import { deleteWorldSetting, updateWorldSetting } from "@/server/services/lore.service";

const schema = z.object({
  category: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  importance: z.number().int().min(1).max(5).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ settingId: string }> }
) {
  try {
    const { settingId } = await params;
    const input = schema.parse(await request.json());
    const worldSetting = await updateWorldSetting(settingId, input);
    return worldSetting ? json({ worldSetting }) : notFound("World setting not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ settingId: string }> }
) {
  try {
    const { settingId } = await params;
    const deleted = await deleteWorldSetting(settingId);
    return deleted ? json({ ok: true }) : notFound("World setting not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
