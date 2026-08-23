import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/format";
import { listPolls, type Poll } from "@/lib/polls";

export const dynamic = "force-dynamic";

function pollHref(poll: Poll) {
  return `/polls/${encodeURIComponent(poll.codename)}`;
}

function adminPollAction(poll: Poll, action: "close" | "remove") {
  return `/api/admin/polls/${encodeURIComponent(poll.codename)}/${action}`;
}

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin");
  }

  const polls = await listPolls();

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Polls</h1>
          <p>All PocketBase polls currently available to Tiny Polls.</p>
        </div>
        <div className="adminHeroActions">
          <Link className="primaryButton" href="/admin/polls/new">
            New Poll
          </Link>
          <form action="/api/admin/logout" method="post">
            <button className="secondaryButton" type="submit">
              Sign Out
            </button>
          </form>
        </div>
      </section>

      <section className="adminPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Index</p>
            <h2>{polls.length} polls</h2>
          </div>
        </div>

        {polls.length === 0 ? (
          <p className="muted">No polls have been created yet.</p>
        ) : (
          <div className="pollList">
            {polls.map((poll) => (
              <article className="pollListItem" key={poll.recordId}>
                <div className="pollListMain">
                  <span className={`statusBadge ${poll.status}`}>
                    {poll.status}
                  </span>
                  <h3>{poll.name}</h3>
                  <p>{poll.question}</p>
                  <dl>
                    <div>
                      <dt>Codename</dt>
                      <dd>{poll.codename}</dd>
                    </div>
                    <div>
                      <dt>Closes</dt>
                      <dd>{formatDateTime(poll.expiresAt)}</dd>
                    </div>
                    <div>
                      <dt>Options</dt>
                      <dd>{poll.options.length}</dd>
                    </div>
                  </dl>
                </div>
                <nav
                  className="pollActions"
                  aria-label={`${poll.name} actions`}
                >
                  <Link href={`/owner/${encodeURIComponent(poll.codename)}`}>
                    Results
                  </Link>
                  <Link href={pollHref(poll)}>Vote</Link>
                  <Link
                    href={`/admin/polls/${encodeURIComponent(
                      poll.codename,
                    )}/edit`}
                  >
                    Edit
                  </Link>
                  <form action={adminPollAction(poll, "close")} method="post">
                    <button disabled={poll.status === "closed"} type="submit">
                      Close Poll
                    </button>
                  </form>
                  <form action={adminPollAction(poll, "remove")} method="post">
                    <button className="dangerAction" type="submit">
                      Remove Poll
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
