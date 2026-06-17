import { NovelDetailView } from "@/features/novels/NovelDetailView";

export default async function NovelDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ novelId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ novelId }, query] = await Promise.all([params, searchParams]);
  return <NovelDetailView novelId={novelId} initialTab={query.tab} />;
}
