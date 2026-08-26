"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type FilterKey = "answers" | "source";

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
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const tableRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!tableRootRef.current?.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenFilter(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
  const selectedOptionLabel =
    options.find((option) => option.id === selectedOptionId)?.label ||
    labels.allOptions;
  const selectedSourceLabel = selectedSource || labels.allSources;

  return (
    <div ref={tableRootRef}>
      <div className="sectionHeader compact">
        <div>
          <p className="eyebrow">{labels.private}</p>
          <h2>{labels.submissions}</h2>
        </div>
        <span className="tableCountTag" data-table-count={filteredRows.length}>
          {countLabel}
        </span>
      </div>
      <div
        className="tableScroller ownerSubmissionList"
        data-filter-open={Boolean(openFilter)}
      >
        {rows.length ? (
          <table className="ownerTable submissionsTable">
            <thead>
              <tr>
                <th scope="col">{labels.voterName}</th>
                <th scope="col">{labels.voterId}</th>
                <th scope="col">
                  <span className="tableHeaderAction">
                    <span>{labels.answers}</span>
                    <button
                      aria-expanded={openFilter === "answers"}
                      aria-haspopup="menu"
                      className="tableFilterButton"
                      data-active={Boolean(selectedOptionId)}
                      onClick={() =>
                        setOpenFilter((current) =>
                          current === "answers" ? null : "answers",
                        )
                      }
                      title={selectedOptionLabel}
                      type="button"
                    >
                      <span className="srOnly">{labels.optionFilter}</span>
                      <FilterIcon />
                    </button>
                    {openFilter === "answers" ? (
                      <div className="tableFilterPopover" role="menu">
                        <FilterMenuItem
                          isSelected={!selectedOptionId}
                          label={labels.allOptions}
                          onSelect={() => {
                            setSelectedOptionId("");
                            setOpenFilter(null);
                          }}
                        />
                        {options.map((option) => (
                          <FilterMenuItem
                            isSelected={selectedOptionId === option.id}
                            key={option.id}
                            label={option.label}
                            onSelect={() => {
                              setSelectedOptionId(option.id);
                              setOpenFilter(null);
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </span>
                </th>
                <th scope="col">
                  <span className="tableHeaderAction">
                    <span>{labels.source}</span>
                    <button
                      aria-expanded={openFilter === "source"}
                      aria-haspopup="menu"
                      className="tableFilterButton"
                      data-active={Boolean(selectedSource)}
                      onClick={() =>
                        setOpenFilter((current) =>
                          current === "source" ? null : "source",
                        )
                      }
                      title={selectedSourceLabel}
                      type="button"
                    >
                      <span className="srOnly">{labels.sourceFilter}</span>
                      <FilterIcon />
                    </button>
                    {openFilter === "source" ? (
                      <div className="tableFilterPopover" role="menu">
                        <FilterMenuItem
                          isSelected={!selectedSource}
                          label={labels.allSources}
                          onSelect={() => {
                            setSelectedSource("");
                            setOpenFilter(null);
                          }}
                        />
                        {sources.map((source) => (
                          <FilterMenuItem
                            isSelected={selectedSource === source}
                            key={source}
                            label={source}
                            onSelect={() => {
                              setSelectedSource(source);
                              setOpenFilter(null);
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </span>
                </th>
                <th scope="col">{labels.submitted}</th>
                <th scope="col">{labels.result}</th>
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
    </div>
  );
}

function FilterMenuItem({
  isSelected,
  label,
  onSelect,
}: {
  isSelected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-checked={isSelected}
      className="tableFilterMenuItem"
      data-selected={isSelected}
      onClick={onSelect}
      role="menuitemradio"
      type="button"
    >
      {label}
    </button>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="tableFilterIcon" viewBox="0 0 20 20">
      <path d="M4 5h12l-5 6v4l-2 1v-5L4 5Z" />
    </svg>
  );
}
