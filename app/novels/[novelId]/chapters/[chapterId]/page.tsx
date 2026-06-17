import { ChapterEditor } from "@/components/editor/ChapterEditor";

export default async function ChapterEditorPage({
  params
}: {
  params: Promise<{ novelId: string; chapterId: string }>;
}) {
  const { novelId, chapterId } = await params;
  return <ChapterEditor novelId={novelId} chapterId={chapterId} />;
}
