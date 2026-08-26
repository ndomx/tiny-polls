import {
  type OwnerSubmissionRow,
  OwnerSubmissionsTable,
} from "@/components/owner-submissions-table";
import { type Dictionary, formatMessage } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/locales";
import { formatClock, formatShortTime } from "@/lib/format";
import type { ResultsPayload } from "@/lib/submissions";
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
  const optionLabels = new Map(
    results.poll.options.map((option) => [option.id, option.label]),
  );
  const rows: OwnerSubmissionRow[] = (results.submissions ?? []).map(
    (submission) => {
      const answerLabels = submission.selectedOptions.map(
        (id) => optionLabels.get(id) || id,
      );

      return {
        id: submission.id,
        voterName: submission.voterName,
        voterId: shortVoterId(submission.voterId),
        answerText: answerLabels.join(", "),
        selectedOptionIds: submission.selectedOptions,
        source: submission.source,
        submittedAt: submission.createdAt,
        submittedLabel: formatShortTime(submission.createdAt, locale),
        isCorrect: submission.isCorrect,
        resultLabel: submission.isCorrect
          ? dictionary.common.correct
          : labels.notCorrect,
      };
    },
  );

  return (
    <section className="ownerPanel">
      <OwnerSubmissionsTable
        labels={{
          allOptions: labels.allOptions,
          allSources: labels.allSources,
          answers: labels.answers,
          filteredSubmissions: labels.filteredSubmissions,
          noFilteredSubmissions: labels.noFilteredSubmissions,
          noSubmissions: labels.noSubmissions,
          optionFilter: labels.optionFilter,
          private: labels.private,
          result: labels.result,
          source: dictionary.common.source,
          sourceFilter: labels.sourceFilter,
          submissions: labels.submissions,
          submitted: labels.submitted,
          totalSubmissions: labels.totalSubmissions,
          voterId: labels.voterId,
          voterName: labels.voterName,
        }}
        options={results.poll.options.map((option) => ({
          id: option.id,
          label: option.label,
        }))}
        rows={rows}
      />
    </section>
  );
}
