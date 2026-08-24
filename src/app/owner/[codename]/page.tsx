import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { Notice } from "@/components/notice";
import { ResultsShell } from "@/components/results-shell";
import { SourceLinkCopy } from "@/components/source-link-copy";
import { getAdminSession } from "@/lib/admin-auth";
import { getResults } from "@/lib/submissions";

export const dynamic = "force-dynamic";

type OwnerPageProps = {
  params: Promise<{ codename: string }>;
};

export default async function OwnerPage({ params }: OwnerPageProps) {
  const { codename } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect(
      `/admin/login?next=${encodeURIComponent(
        `/owner/${encodeURIComponent(codename)}`,
      )}`,
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
        <div className="ownerHeroTools">
          <SourceLinkCopy pollPath={shareBase} />
          <form action="/api/admin/logout" method="post">
            <button className="signOutButton" type="submit">
              Sign Out
            </button>
          </form>
        </div>
      </section>
      <ResultsShell owner results={results} />
      <AutoRefresh />
    </main>
  );
}
