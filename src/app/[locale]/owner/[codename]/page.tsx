import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { Notice } from "@/components/notice";
import { ResultsShell } from "@/components/results-shell";
import { SourceLinkCopy } from "@/components/source-link-copy";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";
import { getResults } from "@/lib/submissions";

export const dynamic = "force-dynamic";

type OwnerPageProps = {
  params: Promise<{ codename: string; locale: string }>;
};

export default async function OwnerPage({ params }: OwnerPageProps) {
  const { codename, locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const session = await getAdminSession();
  const ownerPath = withLocale(
    locale,
    `/owner/${encodeURIComponent(codename)}`,
  );

  if (!session) {
    redirect(
      withLocale(locale, `/admin/login?next=${encodeURIComponent(ownerPath)}`),
    );
  }

  const results = await getResults(codename, true);

  if (!results) {
    return (
      <Notice
        eyebrow={dictionary.common.ownerDashboard}
        title={dictionary.notice.pollNotFoundTitle}
        message={dictionary.notice.pollNotFoundMessage}
      />
    );
  }

  const shareBase = withLocale(
    locale,
    `/polls/${encodeURIComponent(results.poll.codename)}`,
  );

  return (
    <main className="resultsPage">
      <section className="resultsHero">
        <div>
          <Link className="ownerBackLink" href={withLocale(locale, "/admin")}>
            <span aria-hidden="true">&larr;</span>
            {dictionary.common.admin}
          </Link>
          <h1>{results.poll.name}</h1>
          <p>{dictionary.ownerPage.description}</p>
        </div>
        <div className="ownerHeroTools">
          <SourceLinkCopy labels={dictionary.common} pollPath={shareBase} />
          <form action="/api/admin/logout" method="post">
            <input name="locale" type="hidden" value={locale} />
            <button className="signOutButton" type="submit">
              {dictionary.common.signOut}
            </button>
          </form>
        </div>
      </section>
      <ResultsShell
        dictionary={dictionary}
        locale={locale}
        owner
        results={results}
      />
      <AutoRefresh />
    </main>
  );
}
