import { handleRouteError, json, notFound } from "@/server/http";
import { getVersion } from "@/server/services/version.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await params;
    const version = await getVersion(versionId);
    return version ? json({ version }) : notFound("Version not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}
