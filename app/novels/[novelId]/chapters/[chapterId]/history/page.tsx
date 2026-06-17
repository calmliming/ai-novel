import { ChapterHistoryView } from "@/features/versions/ChapterHistoryView";

export default async function ChapterHistoryPage({
  params
}: {
  params: Promise<{ novelId: string; chapterId: string }>;
}) {
  const { novelId, chapterId } = await params;
  return <ChapterHistoryView novelId={novelId} chapterId={chapterId} />;
}
