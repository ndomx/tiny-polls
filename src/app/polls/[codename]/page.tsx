import { cookies } from "next/headers";
import { Notice } from "@/components/notice";
import { formatDateTime } from "@/lib/format";
import { getPoll, isExpired } from "@/lib/polls";
import { getSubmissionForVoter } from "@/lib/submissions";
import { isValidVoterId, voterCookieName } from "@/lib/voter";

export const dynamic = "force-dynamic";

type PollPageProps = {
  params: Promise<{ codename: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<PollPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function PollPage({
  params,
  searchParams,
}: PollPageProps) {
  const { codename } = await params;
  const query = await searchParams;
  const poll = await getPoll(codename);

  if (!poll) {
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
    ? await getSubmissionForVoter(poll, voterId || "")
    : null;
  const previousOptions = new Set(previousSubmission?.selectedOptions || []);
  const closed = isExpired(poll);
  const source =
    getParam(query, "source") || getParam(query, "utm_source") || "direct";
  const utmSource = getParam(query, "utm_source");
  const utmMedium = getParam(query, "utm_medium");
  const utmCampaign = getParam(query, "utm_campaign");
  const optionInputType = poll.maxSelections === 1 ? "radio" : "checkbox";

  return (
    <main className="pollPage">
      <section className="pollHero">
        <div>
          <p className="eyebrow">{poll.stage || "Poll"}</p>
          <h1>{poll.question}</h1>
          {poll.description ? <p>{poll.description}</p> : null}
        </div>
        <dl>
          <div>
            <dt>Poll</dt>
            <dd>{poll.name}</dd>
          </div>
          <div>
            <dt>Closes</dt>
            <dd>{formatDateTime(poll.expiresAt)}</dd>
          </div>
        </dl>
      </section>

      <form
        className="pollForm"
        action={`/api/polls/${encodeURIComponent(poll.codename)}/vote`}
        method="post"
      >
        <input name="source" type="hidden" value={source} />
        <input name="utm_source" type="hidden" value={utmSource} />
        <input name="utm_medium" type="hidden" value={utmMedium} />
        <input name="utm_campaign" type="hidden" value={utmCampaign} />

        <label className="field">
          <span>Your name</span>
          <input
            autoComplete="name"
            defaultValue={previousSubmission?.voterName || ""}
            disabled={closed}
            maxLength={80}
            name="voterName"
            required
            type="text"
          />
        </label>

        <fieldset className="optionsField" disabled={closed}>
          <legend>
            {poll.maxSelections === 1
              ? "Choose one answer"
              : `Choose ${poll.minSelections}-${poll.maxSelections} answers`}
          </legend>
          <div className="optionsGrid">
            {poll.options.map((option) => (
              <label className="optionTile" key={option.id}>
                <input
                  defaultChecked={previousOptions.has(option.id)}
                  name="options"
                  required={optionInputType === "radio"}
                  type={optionInputType}
                  value={option.id}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {closed ? (
          <p className="closedNotice">This poll is closed.</p>
        ) : (
          <button className="primaryButton" type="submit">
            {previousSubmission ? "Update Vote" : "Submit Vote"}
          </button>
        )}
      </form>
    </main>
  );
}
