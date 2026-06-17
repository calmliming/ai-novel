import { badRequest, handleRouteError, notFound } from "@/server/http";
import { exportNovelBundle } from "@/server/services/novel.service";
import { renderNovelAsMarkdown, renderNovelAsText } from "@/server/services/export.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "txt";
    const bundle = await exportNovelBundle(novelId);

    if (!bundle) {
      return notFound("Novel not found.");
    }

    if (format === "json") {
      return new Response(JSON.stringify(bundle, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": contentDisposition(bundle.novel.title, "json")
        }
      });
    }

    if (format === "md") {
      return new Response(renderNovelAsMarkdown(bundle), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": contentDisposition(bundle.novel.title, "md")
        }
      });
    }

    if (format === "txt") {
      return new Response(renderNovelAsText(bundle), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": contentDisposition(bundle.novel.title, "txt")
        }
      });
    }

    return badRequest("Unsupported export format.");
  } catch (error) {
    return handleRouteError(error);
  }
}

function contentDisposition(title: string, ext: string) {
  const fileName = `${title}.${ext}`;
  return `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
