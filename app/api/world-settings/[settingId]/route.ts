import { handleRouteError, json, notFound } from "@/server/http";
import { deleteWorldSetting } from "@/server/services/lore.service";

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
