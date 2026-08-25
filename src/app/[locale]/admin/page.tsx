import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatMessage, getDictionary } from "@/i18n/get-dictionary";
import { isLocale, type Locale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/format";
import { listPolls, type Poll } from "@/lib/polls";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

function pollHref(locale: Locale, poll: Poll) {
  return withLocale(locale, `/polls/${encodeURIComponent(poll.codename)}`);
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

  const polls = await listPolls();
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
                <div className="pollListMain">
                  <span className={`statusBadge ${poll.status}`}>
                    {statusLabels[poll.status]}
                  </span>
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
                    <div>
                      <dt>{dictionary.adminPage.options}</dt>
                      <dd>{poll.options.length}</dd>
                    </div>
                  </dl>
                </div>
                <nav
                  className="pollActions"
                  aria-label={formatMessage(dictionary.adminPage.actionsLabel, {
                    name: poll.name,
                  })}
                >
                  <Link
                    href={withLocale(
                      locale,
                      `/owner/${encodeURIComponent(poll.codename)}`,
                    )}
                  >
                    {dictionary.common.results}
                  </Link>
                  <Link href={pollHref(locale, poll)}>
                    {dictionary.common.vote}
                  </Link>
                  <Link
                    href={withLocale(
                      locale,
                      `/admin/polls/${encodeURIComponent(poll.codename)}/edit`,
                    )}
                  >
                    {dictionary.common.edit}
                  </Link>
                  <form action={adminPollAction(poll, "close")} method="post">
                    <input name="locale" type="hidden" value={locale} />
                    <button disabled={poll.status === "closed"} type="submit">
                      {dictionary.adminPage.closePoll}
                    </button>
                  </form>
                  <form action={adminPollAction(poll, "remove")} method="post">
                    <input name="locale" type="hidden" value={locale} />
                    <button className="dangerAction" type="submit">
                      {dictionary.adminPage.removePoll}
                    </button>
                  </form>
                </nav>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
