"use client";

import { useState } from "react";
import type { PollOption } from "@/lib/polls";

type AdminOptionsEditorProps = {
  correctAnswerId?: string;
  labels: {
    addOption: string;
    answers: string;
    correct: string;
    option: string;
    removeOption: string;
    setLater: string;
  };
  options: (PollOption | null)[];
};

type OptionRow = {
  key: string;
  id: string;
  label: string;
};

const maxOptions = 8;

function lastFilledOptionIndex(options: (PollOption | null)[]) {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (options[index] !== null) {
      return index;
    }
  }

  return -1;
}

function initialRows(options: (PollOption | null)[]): OptionRow[] {
  const visibleCount = Math.max(1, lastFilledOptionIndex(options) + 1);

  return options.slice(0, visibleCount).map((option, index) => ({
    id: option?.id || "",
    key: option?.id || `new-${index}`,
    label: option?.label || "",
  }));
}

function formatLabel(message: string, number: number) {
  return message.replaceAll("{number}", String(number));
}

export function AdminOptionsEditor({
  correctAnswerId = "",
  labels,
  options,
}: AdminOptionsEditorProps) {
  const [rows, setRows] = useState(() => initialRows(options));
  const [correctIndex, setCorrectIndex] = useState<number | null>(() => {
    const index = initialRows(options).findIndex(
      (option) => option.id === correctAnswerId,
    );

    return index >= 0 ? index : null;
  });

  function addOption() {
    setRows((current) =>
      current.length >= maxOptions
        ? current
        : [
            ...current,
            { id: "", key: `new-${Date.now()}-${current.length}`, label: "" },
          ],
    );
  }

  function removeOption(index: number) {
    setRows((current) =>
      current.length === 1
        ? current.map((row) => ({ ...row, id: "", label: "" }))
        : current.filter((_, rowIndex) => rowIndex !== index),
    );
    setCorrectIndex((current) => {
      if (current === null) {
        return null;
      }

      if (current === index) {
        return null;
      }

      return current > index ? current - 1 : current;
    });
  }

  function updateOption(index: number, label: string) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, label } : row,
      ),
    );
  }

  return (
    <fieldset className="adminOptionsField">
      <div className="answersHeader">
        <legend>{labels.answers}</legend>
        <div className="answersHeaderActions">
          <label className="deferredAnswerChoice">
            <input
              checked={correctIndex === null}
              name="correctOption"
              onChange={() => setCorrectIndex(null)}
              type="radio"
              value=""
            />
            <span>{labels.setLater}</span>
          </label>
          <button
            className="secondaryButton"
            disabled={rows.length >= maxOptions}
            onClick={addOption}
            type="button"
          >
            {labels.addOption}
          </button>
        </div>
      </div>

      <div className="adminOptionsList">
        {rows.map((option, index) => (
          <div className="adminOptionRow" key={option.key}>
            <input name={`optionId_${index}`} type="hidden" value={option.id} />
            <label className="field">
              <span>{formatLabel(labels.option, index + 1)}</span>
              <input
                maxLength={160}
                name={`optionLabel_${index}`}
                onChange={(event) => updateOption(index, event.target.value)}
                type="text"
                value={option.label}
              />
            </label>
            <label className="correctChoice">
              <input
                checked={correctIndex === index}
                name="correctOption"
                onChange={() => setCorrectIndex(index)}
                type="radio"
                value={index}
              />
              <span>{labels.correct}</span>
            </label>
            <button
              aria-label={formatLabel(labels.removeOption, index + 1)}
              className="removeOptionButton"
              onClick={() => removeOption(index)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M6 6l1 14h10l1-14" />
                <path d="M10 11v5" />
                <path d="M14 11v5" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
