"use client";

import { useMemo, useState } from "react";

export type OwnerSubmissionRow = {
  id: string;
  voterName: string;
  voterId: string;
  answerText: string;
  selectedOptionIds: string[];
  source: string;
  submittedAt: string;
  submittedLabel: string;
  isCorrect: boolean;
  resultLabel: string;
};

type OwnerSubmissionOption = {
  id: string;
  label: string;
};

type OwnerSubmissionsTableLabels = {
  allOptions: string;
  allSources: string;
  answers: string;
  filteredSubmissions: string;
  noFilteredSubmissions: string;
  noSubmissions: string;
  optionFilter: string;
  private: string;
  result: string;
  source: string;
  sourceFilter: string;
  submissions: string;
  submitted: string;
  totalSubmissions: string;
  voterId: string;
  voterName: string;
};

type OwnerSubmissionsTableProps = {
  labels: OwnerSubmissionsTableLabels;
  options: OwnerSubmissionOption[];
  rows: OwnerSubmissionRow[];
};

function formatCountLabel(
  message: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (formatted, [key, value]) =>
      formatted.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

export function OwnerSubmissionsTable({
  labels,
  options,
  rows,
}: OwnerSubmissionsTableProps) {
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const sources = useMemo(
    () =>
      [...new Set(rows.map((row) => row.source))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!selectedOptionId ||
            row.selectedOptionIds.includes(selectedOptionId)) &&
          (!selectedSource || row.source === selectedSource),
      ),
    [rows, selectedOptionId, selectedSource],
  );

  const countLabel =
    filteredRows.length === rows.length
      ? formatCountLabel(labels.totalSubmissions, { count: rows.length })
      : formatCountLabel(labels.filteredSubmissions, {
          count: filteredRows.length,
          total: rows.length,
        });

  return (
    <>
      <div className="sectionHeader compact">
        <div>
          <p className="eyebrow">{labels.private}</p>
          <h2>{labels.submissions}</h2>
        </div>
        <span className="tableCountTag" data-table-count={filteredRows.length}>
          {countLabel}
        </span>
      </div>
      <div className="tableScroller ownerSubmissionList">
        {rows.length ? (
          <table className="ownerTable submissionsTable">
            <thead>
              <tr>
                <th scope="col">{labels.voterName}</th>
                <th scope="col">{labels.voterId}</th>
                <th scope="col">{labels.answers}</th>
                <th scope="col">{labels.source}</th>
                <th scope="col">{labels.submitted}</th>
                <th scope="col">{labels.result}</th>
              </tr>
              <tr className="tableFilterRow">
                <th />
                <th />
                <th>
                  <select
                    aria-label={labels.optionFilter}
                    className="tableFilterSelect"
                    onChange={(event) =>
                      setSelectedOptionId(event.currentTarget.value)
                    }
                    value={selectedOptionId}
                  >
                    <option value="">{labels.allOptions}</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </th>
                <th>
                  <select
                    aria-label={labels.sourceFilter}
                    className="tableFilterSelect"
                    onChange={(event) =>
                      setSelectedSource(event.currentTarget.value)
                    }
                    value={selectedSource}
                  >
                    <option value="">{labels.allSources}</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </th>
                <th />
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? (
                filteredRows.map((row) => (
                  <tr
                    data-answers={row.answerText}
                    data-is-correct={row.isCorrect}
                    data-source={row.source}
                    data-submitted-at={row.submittedAt}
                    data-voter-id={row.voterId}
                    data-voter-name={row.voterName}
                    key={row.id}
                  >
                    <td>
                      <strong>{row.voterName}</strong>
                    </td>
                    <td>{row.voterId}</td>
                    <td>{row.answerText}</td>
                    <td>{row.source}</td>
                    <td>
                      <time dateTime={row.submittedAt}>
                        {row.submittedLabel}
                      </time>
                    </td>
                    <td>
                      <span
                        className={row.isCorrect ? "winnerBadge" : "plainBadge"}
                      >
                        {row.resultLabel}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="emptyTableCell" colSpan={6}>
                    {labels.noFilteredSubmissions}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="muted">{labels.noSubmissions}</p>
        )}
      </div>
    </>
  );
}
