import { z } from "zod";
import { handleRouteError, json } from "@/server/http";
import { upsertOutline } from "@/server/services/lore.service";
import { readDatabase } from "@/server/data/database";

const schema = z.object({
  id: z.string().optional(),
  volumeId: z.string().optional(),
  chapterId: z.string().optional(),
  type: z.enum(["book", "volume", "chapter", "plot"]).optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  orderIndex: z.number().int().optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const { novelId } = await params;
    const database = await readDatabase();
    return json({
      outlines: database.outlines
        .filter((outline) => outline.novelId === novelId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
    });
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
    return json({ outline: await upsertOutline(novelId, input) });
  } catch (error) {
    return handleRouteError(error);
  }
}
