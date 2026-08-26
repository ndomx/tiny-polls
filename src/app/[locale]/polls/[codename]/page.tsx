import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Notice } from "@/components/notice";
import { formatMessage, getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/locales";
import { formatDateTime } from "@/lib/format";
import { getPoll, isExpired } from "@/lib/polls";
import { getSiteUrl } from "@/lib/site-url";
import { getSubmissionForVoter } from "@/lib/submissions";
import { isValidVoterId, voterCookieName } from "@/lib/voter";

export const dynamic = "force-dynamic";

type PollPageProps = {
  params: Promise<{ codename: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<PollPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export async function generateMetadata({
  params,
  searchParams,
}: PollPageProps): Promise<Metadata> {
  const { codename, locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);
  const poll = await getPoll(codename);

  if (!poll) {
    return {
      title: dictionary.notice.pollNotFoundTitle,
      description: dictionary.notice.pollNotFoundMessage,
    };
  }

  const query = await searchParams;
  const source = getParam(query, "source");
  const siteUrl = getSiteUrl();
  const pollUrl = new URL(
    `/${locale}/polls/${encodeURIComponent(poll.codename)}`,
    siteUrl,
  );

  if (source) {
    pollUrl.searchParams.set("source", source);
  }

  return {
    metadataBase: new URL(siteUrl),
    title: poll.name,
    description: poll.question,
    alternates: {
      canonical: pollUrl.toString(),
    },
    openGraph: {
      title: poll.name,
      description: poll.question,
      url: pollUrl.toString(),
      images: [
        {
          url: "/share-preview.jpg",
          width: 1200,
          height: 630,
          alt: poll.name,
        },
      ],
      siteName: dictionary.common.appName,
      type: "website",
    },
  };
}

export default async function PollPage({
  params,
  searchParams,
}: PollPageProps) {
  const { codename, locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const query = await searchParams;
  const poll = await getPoll(codename);

  if (!poll) {
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
    ? await getSubmissionForVoter(poll, voterId || "")
    : null;
  const previousOptions = new Set(previousSubmission?.selectedOptions || []);
  const now = new Date();
  const closed = isExpired(poll, now);
  const ended =
    poll.status === "closed" ||
    (poll.status === "open" &&
      now.getTime() > new Date(poll.expiresAt).getTime());
  const correctAnswerIds = new Set(poll.correctAnswerIds);
  const correctAnswers = poll.options.filter((option) =>
    correctAnswerIds.has(option.id),
  );
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
          <p className="eyebrow">{poll.stage || dictionary.common.poll}</p>
          <h1>{poll.question}</h1>
          {poll.description ? <p>{poll.description}</p> : null}
        </div>
        <dl>
          <div>
            <dt>{dictionary.common.poll}</dt>
            <dd>{poll.name}</dd>
          </div>
          <div>
            <dt>{dictionary.common.closes}</dt>
            <dd>{formatDateTime(poll.expiresAt, locale)}</dd>
          </div>
        </dl>
      </section>

      <form
        className="pollForm"
        action={`/api/polls/${encodeURIComponent(poll.codename)}/vote`}
        method="post"
      >
        <input name="locale" type="hidden" value={locale} />
        <input name="source" type="hidden" value={source} />
        <input name="utm_source" type="hidden" value={utmSource} />
        <input name="utm_medium" type="hidden" value={utmMedium} />
        <input name="utm_campaign" type="hidden" value={utmCampaign} />

        <label className="field">
          <span>{dictionary.pollPage.yourName}</span>
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
              ? dictionary.pollPage.chooseOne
              : formatMessage(dictionary.pollPage.chooseRange, {
                min: poll.minSelections,
                max: poll.maxSelections,
              })}
          </legend>
          <div className="optionsGrid">
            {poll.options.map((option) => (
              <label
                className={`optionTile ${ended && correctAnswerIds.has(option.id)
                    ? "correctAnswerTile"
                    : ""
                  }`}
                key={option.id}
              >
                <input
                  defaultChecked={previousOptions.has(option.id)}
                  name="options"
                  required={optionInputType === "radio"}
                  type={optionInputType}
                  value={option.id}
                />
                <span>{option.label}</span>
                {ended && correctAnswerIds.has(option.id) ? (
                  <strong>{dictionary.common.correct}</strong>
                ) : null}
              </label>
            ))}
          </div>
        </fieldset>

        {closed ? (
          <div className="closedAnswerPanel">
            <p className="closedNotice">{dictionary.pollPage.closed}</p>
            {ended && correctAnswers.length > 0 ? (
              <div>
                <span>{dictionary.pollPage.correctAnswerIs}</span>
                <strong>
                  {correctAnswers.map((answer) => answer.label).join(", ")}
                </strong>
              </div>
            ) : ended ? (
              <div>
                <span>{dictionary.pollPage.correctAnswerNotSet}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <button className="primaryButton" type="submit">
            {previousSubmission
              ? dictionary.pollPage.updateVote
              : dictionary.pollPage.submitVote}
          </button>
        )}
      </form>
    </main>
  );
}
