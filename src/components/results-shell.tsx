import { type Dictionary, formatMessage } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/locales";
import { formatClock, formatShortTime } from "@/lib/format";
import type { ResultsPayload, Submission } from "@/lib/submissions";
import { shortVoterId } from "@/lib/voter";

const colors = ["#176b5b", "#d96c3d", "#3656a6", "#a33f63", "#6d7f2f"];

type ResultsShellProps = {
  dictionary: Dictionary;
  locale: Locale;
  results: ResultsPayload;
  owner?: boolean;
};

export function ResultsShell({
  dictionary,
  locale,
  results,
  owner = false,
}: ResultsShellProps) {
  const labels = dictionary.resultsShell;
  const totalSelections = Math.max(
    1,
    results.options.reduce((sum, option) => sum + option.count, 0),
  );

  return (
    <section className="resultsShell" aria-live="polite">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">{labels.liveResults}</p>
          <h2>{labels.currentVoteCount}</h2>
        </div>
        <p className="muted">
          {formatMessage(labels.updated, { time: formatClock(locale) })}
        </p>
      </div>

      <div className="currentResults">
        {results.options.map((option, index) => {
          const percentage = Math.round((option.count / totalSelections) * 100);
          const color = colors[index % colors.length];

          return (
            <article className="resultRow" key={option.id}>
              <div className="resultLabel">
                <span className="swatch" style={{ background: color }} />
                <strong>{option.label}</strong>
                <span>
                  {option.count} {labels.votes}
                </span>
              </div>
              <div className="barTrack">
                <div
                  className="barFill"
                  style={{ background: color, width: `${percentage}%` }}
                />
              </div>
              <span className="percentage">{percentage}%</span>
            </article>
          );
        })}
      </div>

      <div className="chartPanel">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">{labels.share}</p>
            <h2>{labels.voteDistribution}</h2>
          </div>
          <p className="muted">
            {formatMessage(labels.totalSubmissions, {
              count: results.totalVotes,
            })}
          </p>
        </div>
        <PieChart dictionary={dictionary} results={results} />
      </div>

      {owner ? (
        <OwnerDetails
          dictionary={dictionary}
          locale={locale}
          results={results}
        />
      ) : null}
    </section>
  );
}

function pieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startRatio: number,
  endRatio: number,
) {
  const startAngle = startRatio * Math.PI * 2 - Math.PI / 2;
  const endAngle = endRatio * Math.PI * 2 - Math.PI / 2;
  const startX = centerX + Math.cos(startAngle) * radius;
  const startY = centerY + Math.sin(startAngle) * radius;
  const endX = centerX + Math.cos(endAngle) * radius;
  const endY = centerY + Math.sin(endAngle) * radius;
  const largeArc = endRatio - startRatio > 0.5 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${startX} ${startY}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
    "Z",
  ].join(" ");
}

function PieChart({
  dictionary,
  results,
}: {
  dictionary: Dictionary;
  results: ResultsPayload;
}) {
  const labels = dictionary.resultsShell;
  const totalSelections = results.options.reduce(
    (sum, option) => sum + option.count,
    0,
  );
  let cumulative = 0;

  return (
    <div className="pieChartWrap">
      <svg className="pieChart" viewBox="0 0 240 240" role="img">
        <title>{labels.voteDistribution}</title>
        {totalSelections === 0 ? (
          <circle cx="120" cy="120" fill="#ece3d7" r="96" />
        ) : (
          results.options.map((option, index) => {
            const startRatio = cumulative / totalSelections;
            cumulative += option.count;
            const endRatio = cumulative / totalSelections;

            if (option.count === 0) {
              return null;
            }

            return (
              <path
                d={pieSlicePath(120, 120, 96, startRatio, endRatio)}
                fill={colors[index % colors.length]}
                key={option.id}
              />
            );
          })
        )}
        <circle className="pieHole" cx="120" cy="120" r="48" />
        <text className="pieTotal" x="120" y="116">
          {totalSelections}
        </text>
        <text className="pieTotalLabel" x="120" y="138">
          {labels.votes}
        </text>
      </svg>

      <div className="pieLegend">
        {results.options.map((option, index) => {
          const percentage =
            totalSelections === 0
              ? 0
              : Math.round((option.count / totalSelections) * 100);

          return (
            <div className="pieLegendRow" key={option.id}>
              <span
                className="swatch"
                style={{ background: colors[index % colors.length] }}
              />
              <strong>{option.label}</strong>
              <span>
                {option.count} {labels.votes} - {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OwnerDetails({
  dictionary,
  locale,
  results,
}: {
  dictionary: Dictionary;
  locale: Locale;
  results: ResultsPayload;
}) {
  const labels = dictionary.resultsShell;

  return (
    <div className="ownerGrid">
      <section className="ownerPanel">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">{labels.sources}</p>
            <h2>{labels.whereVotesCameFrom}</h2>
          </div>
        </div>
        <div className="sourceList">
          {results.sources.length === 0 ? (
            <p className="muted">{labels.noSourceData}</p>
          ) : (
            results.sources.map((source) => (
              <div className="sourceRow" key={source.source}>
                <span>{source.source}</span>
                <strong>{source.count}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="ownerPanel">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">{labels.private}</p>
            <h2>{labels.submissions}</h2>
          </div>
        </div>
        <div className="submissionList ownerSubmissionList">
          {results.submissions?.length ? (
            results.submissions.map((submission) => (
              <SubmissionCard
                dictionary={dictionary}
                key={submission.id}
                locale={locale}
                submission={submission}
                results={results}
              />
            ))
          ) : (
            <p className="muted">{labels.noSubmissions}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({
  dictionary,
  locale,
  results,
  submission,
}: {
  dictionary: Dictionary;
  locale: Locale;
  results: ResultsPayload;
  submission: Submission;
}) {
  const labels = dictionary.resultsShell;
  const answers = submission.selectedOptions
    .map(
      (id) =>
        results.poll.options.find((option) => option.id === id)?.label || id,
    )
    .join(", ");

  return (
    <article className="submissionCard">
      <div>
        <strong>{submission.voterName}</strong>
        <span>
          {formatMessage(labels.voter, {
            id: shortVoterId(submission.voterId),
          })}
        </span>
      </div>
      <div>
        <span>{answers}</span>
        <span>
          {submission.source} - {formatShortTime(submission.createdAt, locale)}
        </span>
      </div>
      <span className={submission.isCorrect ? "winnerBadge" : "plainBadge"}>
        {submission.isCorrect ? dictionary.common.correct : labels.notCorrect}
      </span>
    </article>
  );
}
