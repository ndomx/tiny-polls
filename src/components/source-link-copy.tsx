"use client";

import { useState } from "react";

type SourceLinkCopyProps = {
  labels: {
    copied: string;
    copyLink: string;
    source: string;
    sourcePlaceholder: string;
  };
  pollPath: string;
};

export function SourceLinkCopy({ labels, pollPath }: SourceLinkCopyProps) {
  const [source, setSource] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = new URL(pollPath, window.location.origin);
    const trimmedSource = source.trim();

    if (trimmedSource) {
      url.searchParams.set("source", trimmedSource);
    }

    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="sourceCopy">
      <label className="field">
        <span>{labels.source}</span>
        <input
          onChange={(event) => setSource(event.target.value)}
          placeholder={labels.sourcePlaceholder}
          type="text"
          value={source}
        />
      </label>
      <button className="primaryButton" onClick={copyLink} type="button">
        {copied ? labels.copied : labels.copyLink}
      </button>
    </div>
  );
}
