import { formatClock } from "@/lib/format";
import type { ResultsPayload, Submission } from "@/lib/submissions";
import { shortVoterId } from "@/lib/voter";

const colors = ["#176b5b", "#d96c3d", "#3656a6", "#a33f63", "#6d7f2f"];

type ResultsShellProps = {
  results: ResultsPayload;
  owner?: boolean;
};

export function ResultsShell({ results, owner = false }: ResultsShellProps) {
  const totalSelections = Math.max(
    1,
    results.options.reduce((sum, option) => sum + option.count, 0),
  );

  return (
    <section className="resultsShell" aria-live="polite">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Live Results</p>
          <h2>Current Vote Count</h2>
        </div>
        <p className="muted">Updated {formatClock()}</p>
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
                <span>{option.count} votes</span>
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
            <p className="eyebrow">Share</p>
            <h2>Vote Distribution</h2>
          </div>
          <p className="muted">{results.totalVotes} total submissions</p>
        </div>
        <PieChart results={results} />
      </div>

      {owner ? <OwnerDetails results={results} /> : null}
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

function PieChart({ results }: { results: ResultsPayload }) {
  const totalSelections = results.options.reduce(
    (sum, option) => sum + option.count,
    0,
  );
  let cumulative = 0;

  return (
    <div className="pieChartWrap">
      <svg className="pieChart" viewBox="0 0 240 240" role="img">
        <title>Vote distribution</title>
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
          votes
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
                {option.count} votes · {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OwnerDetails({ results }: { results: ResultsPayload }) {
  return (
    <div className="ownerGrid">
      <section className="ownerPanel">
        <div className="sectionHeader compact">
          <div>
            <p className="eyebrow">Sources</p>
            <h2>Where Votes Came From</h2>
          </div>
        </div>
        <div className="sourceList">
          {results.sources.length === 0 ? (
            <p className="muted">No source data yet.</p>
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
            <p className="eyebrow">Private</p>
            <h2>Submissions</h2>
          </div>
        </div>
        <div className="submissionList">
          {results.submissions?.length ? (
            results.submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                results={results}
              />
            ))
          ) : (
            <p className="muted">No submissions yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({
  results,
  submission,
}: {
  results: ResultsPayload;
  submission: Submission;
}) {
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
        <span>Voter {shortVoterId(submission.voterId)}</span>
      </div>
      <div>
        <span>{answers}</span>
        <span>
          {submission.source} - {submission.createdAt}
        </span>
      </div>
      <span className={submission.isCorrect ? "winnerBadge" : "plainBadge"}>
        {submission.isCorrect ? "Correct" : "Not correct"}
      </span>
    </article>
  );
}
