import { AutoRefresh } from "@/components/auto-refresh";
import { Notice } from "@/components/notice";
import { ResultsShell } from "@/components/results-shell";
import { appConfig } from "@/lib/pocketbase";
import { getResults } from "@/lib/submissions";

export const dynamic = "force-dynamic";

type OwnerPageProps = {
  params: Promise<{ codename: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<OwnerPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function OwnerPage({
  params,
  searchParams,
}: OwnerPageProps) {
  const { codename } = await params;
  const query = await searchParams;
  const ownerKey = getParam(query, "key");

  if (ownerKey !== appConfig().ownerKey) {
    return (
      <Notice
        eyebrow="Owner Dashboard"
        title="Owner key required"
        message="Add your private key to view voter details."
      />
    );
  }

  const results = await getResults(codename, true);

  if (!results) {
    return (
      <Notice
        eyebrow="Owner Dashboard"
        title="Poll not found"
        message="This link does not match a poll."
      />
    );
  }

  const shareBase = `/polls/${encodeURIComponent(results.poll.codename)}`;

  return (
    <main className="resultsPage">
      <section className="resultsHero">
        <div>
          <p className="eyebrow">Owner Dashboard</p>
          <h1>{results.poll.name}</h1>
          <p>Private voter details, source tracking, and live results.</p>
        </div>
        <div className="shareLinks">
          <a href={`${shareBase}?source=family`}>Family Link</a>
          <a href={`${shareBase}?source=friends`}>Friends Link</a>
          <a href={`${shareBase}?source=group`}>Group Link</a>
        </div>
      </section>
      <ResultsShell owner results={results} />
      <AutoRefresh />
    </main>
  );
}
