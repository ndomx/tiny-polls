import { formatClock, formatShortTime } from "@/lib/format";
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
            <p className="eyebrow">History</p>
            <h2>How Answers Changed</h2>
          </div>
          <p className="muted">{results.totalVotes} total submissions</p>
        </div>
        <LineChart results={results} />
      </div>

      {owner ? <OwnerDetails results={results} /> : null}
    </section>
  );
}

function LineChart({ results }: { results: ResultsPayload }) {
  const width = 760;
  const height = 260;
  const padding = 32;
  const history =
    results.history.length > 0 ? results.history : [{ at: "", counts: {} }];
  const maxCount = Math.max(
    1,
    ...results.options.map((option) => option.count),
  );
  const xFor = (index: number) =>
    history.length === 1
      ? padding
      : padding +
        (index * (width - padding * 2)) / Math.max(1, history.length - 1);
  const yFor = (count: number) =>
    height - padding - (count * (height - padding * 2)) / maxCount;

  return (
    <svg className="lineChart" viewBox={`0 0 ${width} ${height}`} role="img">
      <title>Vote history over time</title>
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
      />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
      {results.options.map((option, optionIndex) => {
        const path = history
          .map((point, pointIndex) => {
            const command = pointIndex === 0 ? "M" : "L";
            return `${command} ${xFor(pointIndex)} ${yFor(
              point.counts[option.id] || 0,
            )}`;
          })
          .join(" ");

        return (
          <path
            d={path}
            fill="none"
            key={option.id}
            stroke={colors[optionIndex % colors.length]}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        );
      })}
      {history.map((point, pointIndex) =>
        pointIndex === 0 || pointIndex === history.length - 1 ? (
          <text
            key={`${point.at}-${pointIndex}`}
            x={xFor(pointIndex)}
            y={height - 6}
          >
            {formatShortTime(point.at)}
          </text>
        ) : null,
      )}
    </svg>
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
