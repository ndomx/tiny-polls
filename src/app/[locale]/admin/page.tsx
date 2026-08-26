import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatMessage, getDictionary } from "@/i18n/get-dictionary";
import { isLocale, type Locale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/format";
import { listPollsWithVoteCounts, type Poll } from "@/lib/polls";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

function pollHref(locale: Locale, poll: Poll) {
  return withLocale(locale, `/polls/${encodeURIComponent(poll.codename)}`);
}

function ownerHref(locale: Locale, poll: Poll) {
  return withLocale(locale, `/owner/${encodeURIComponent(poll.codename)}`);
}

function adminPollAction(poll: Poll, action: "close" | "remove") {
  return `/api/admin/polls/${encodeURIComponent(poll.codename)}/${action}`;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const session = await getAdminSession();

  if (!session) {
    redirect(
      withLocale(
        locale,
        `/admin/login?next=${encodeURIComponent(withLocale(locale, "/admin"))}`,
      ),
    );
  }

  const polls = await listPollsWithVoteCounts();
  const statusLabels = {
    closed: dictionary.pollForm.statusClosed,
    draft: dictionary.pollForm.statusDraft,
    open: dictionary.pollForm.statusOpen,
  };

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">{dictionary.common.admin}</p>
          <h1>{dictionary.adminPage.title}</h1>
          <p>{dictionary.adminPage.description}</p>
        </div>
        <div className="adminHeroActions">
          <Link
            className="primaryButton"
            href={withLocale(locale, "/admin/polls/new")}
          >
            {dictionary.adminPage.newPoll}
          </Link>
          <form action="/api/admin/logout" method="post">
            <input name="locale" type="hidden" value={locale} />
            <button className="secondaryButton" type="submit">
              {dictionary.common.signOut}
            </button>
          </form>
        </div>
      </section>

      <section className="adminPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">{dictionary.adminPage.index}</p>
            <h2>
              {formatMessage(dictionary.adminPage.pollCount, {
                count: polls.length,
              })}
            </h2>
          </div>
        </div>

        {polls.length === 0 ? (
          <p className="muted">{dictionary.adminPage.empty}</p>
        ) : (
          <div className="pollList">
            {polls.map((poll) => (
              <article className="pollListItem" key={poll.recordId}>
                <Link
                  aria-label={`${dictionary.common.results}: ${poll.name}`}
                  className="pollCardLink"
                  href={ownerHref(locale, poll)}
                />
                <div className="pollListMain">
                  <div className="pollListMeta">
                    <span className={`statusBadge ${poll.status}`}>
                      {statusLabels[poll.status]}
                    </span>
                    <span className="voteBadge">
                      {poll.voteCount} {dictionary.adminPage.votes}
                    </span>
                  </div>
                  <h3>{poll.name}</h3>
                  <p>{poll.question}</p>
                  <dl>
                    <div>
                      <dt>{dictionary.adminPage.codename}</dt>
                      <dd>{poll.codename}</dd>
                    </div>
                    <div>
                      <dt>{dictionary.common.closes}</dt>
                      <dd>{formatDateTime(poll.expiresAt, locale)}</dd>
                    </div>
                  </dl>
                </div>
                <nav
                  className="pollActions"
                  aria-label={formatMessage(dictionary.adminPage.actionsLabel, {
                    name: poll.name,
                  })}
                >
                  <details className="pollMenu">
                    <summary aria-label={dictionary.adminPage.moreActions}>
                      <span aria-hidden="true" className="pollMenuIcon">
                        <span />
                        <span />
                        <span />
                      </span>
                    </summary>
                    <div className="pollMenuItems">
                      <Link
                        href={withLocale(
                          locale,
                          `/admin/polls/${encodeURIComponent(poll.codename)}/edit`,
                        )}
                      >
                        {dictionary.common.edit}
                      </Link>
                      <form
                        action={adminPollAction(poll, "close")}
                        method="post"
                      >
                        <input name="locale" type="hidden" value={locale} />
                        <button
                          disabled={poll.status === "closed"}
                          type="submit"
                        >
                          {dictionary.adminPage.closePoll}
                        </button>
                      </form>
                      <form
                        action={adminPollAction(poll, "remove")}
                        method="post"
                      >
                        <input name="locale" type="hidden" value={locale} />
                        <button className="dangerAction" type="submit">
                          {dictionary.adminPage.removePoll}
                        </button>
                      </form>
                    </div>
                  </details>
                  <Link
                    className="pollVoteAction"
                    href={pollHref(locale, poll)}
                  >
                    {dictionary.common.vote}
                  </Link>
                </nav>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
