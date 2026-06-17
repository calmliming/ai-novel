import { z } from "zod";
import { badRequest, handleRouteError, json } from "@/server/http";
import { createNovel, listNovels } from "@/server/services/novel.service";

const createNovelSchema = z.object({
  title: z.string().min(1),
  genre: z.string().optional(),
  style: z.string().optional(),
  synopsis: z.string().optional(),
  status: z.enum(["draft", "writing", "completed", "archived"]).optional()
});

export async function GET() {
  try {
    return json({ novels: await listNovels() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createNovelSchema.parse(await request.json());

    if (!input.title.trim()) {
      return badRequest("Novel title is required.");
    }

    return json({ novel: await createNovel(input) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

