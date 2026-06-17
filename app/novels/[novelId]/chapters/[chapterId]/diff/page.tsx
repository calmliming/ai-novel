import { ChapterDiffView } from "@/features/diff/ChapterDiffView";

export default async function ChapterDiffPage({
  params,
  searchParams
}: {
  params: Promise<{ novelId: string; chapterId: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const [{ novelId, chapterId }, query] = await Promise.all([params, searchParams]);

  return (
    <ChapterDiffView
      novelId={novelId}
      chapterId={chapterId}
      initialTo={query.to}
    />
  );
}
