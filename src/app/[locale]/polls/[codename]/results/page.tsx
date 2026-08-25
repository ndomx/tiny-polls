import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { Notice } from "@/components/notice";
import { ResultsShell } from "@/components/results-shell";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale, withLocale } from "@/i18n/locales";
import { getResults, getSubmissionForVoter } from "@/lib/submissions";
import { isValidVoterId, voterCookieName } from "@/lib/voter";

export const dynamic = "force-dynamic";

type ResultsPageProps = {
  params: Promise<{ codename: string; locale: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { codename, locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const results = await getResults(codename);

  if (!results) {
    return (
      <Notice
        eyebrow={dictionary.common.appName}
        title={dictionary.notice.pollNotFoundTitle}
        message={dictionary.notice.pollNotFoundMessage}
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
          <p className="eyebrow">{dictionary.resultsPage.thanks}</p>
          <h1>{results.poll.name}</h1>
          <p>{dictionary.resultsPage.description}</p>
        </div>
        {previousSubmission ? (
          <Link
            className="primaryButton"
            href={withLocale(
              locale,
              `/polls/${encodeURIComponent(results.poll.codename)}`,
            )}
          >
            {dictionary.resultsPage.editVote}
          </Link>
        ) : null}
      </section>
      <ResultsShell dictionary={dictionary} locale={locale} results={results} />
      <AutoRefresh />
    </main>
  );
}
