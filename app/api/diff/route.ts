import { badRequest, handleRouteError, json, notFound } from "@/server/http";
import { diffVersions } from "@/server/services/diff.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fromVersionId = url.searchParams.get("fromVersionId");
    const toVersionId = url.searchParams.get("toVersionId");

    if (!fromVersionId || !toVersionId) {
      return badRequest("fromVersionId and toVersionId are required.");
    }

    const diff = await diffVersions(fromVersionId, toVersionId);
    return diff ? json(diff) : notFound("Version not found.");
  } catch (error) {
    return handleRouteError(error);
  }
}

