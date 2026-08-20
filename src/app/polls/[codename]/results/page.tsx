import { cookies } from "next/headers";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { Notice } from "@/components/notice";
import { ResultsShell } from "@/components/results-shell";
import { getResults, getSubmissionForVoter } from "@/lib/submissions";
import { isValidVoterId, voterCookieName } from "@/lib/voter";

export const dynamic = "force-dynamic";

type ResultsPageProps = {
  params: Promise<{ codename: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { codename } = await params;
  const results = await getResults(codename);

  if (!results) {
    return (
      <Notice
        title="Poll not found"
        message="This link does not match a poll."
      />
    );
  }

  const cookieStore = await cookies();
  const voterId = cookieStore.get(voterCookieName)?.value;
  const previousSubmission = isValidVoterId(voterId)
    ? await getSubmissionForVoter(results.poll, voterId || "")
    : null;

  return (
    <main className="resultsPage">
      <section className="resultsHero">
        <div>
          <p className="eyebrow">Thanks for voting</p>
          <h1>{results.poll.name}</h1>
          <p>Results are anonymous here and refresh automatically.</p>
        </div>
        {previousSubmission ? (
          <Link
            className="primaryButton"
            href={`/polls/${encodeURIComponent(results.poll.codename)}`}
          >
            Edit Vote
          </Link>
        ) : null}
      </section>
      <ResultsShell results={results} />
      <AutoRefresh />
    </main>
  );
}
