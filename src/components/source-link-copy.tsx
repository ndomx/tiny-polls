"use client";

import { useState } from "react";

type SourceLinkCopyProps = {
  pollPath: string;
};

export function SourceLinkCopy({ pollPath }: SourceLinkCopyProps) {
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
        <span>Source</span>
        <input
          onChange={(event) => setSource(event.target.value)}
          placeholder="family, friends, group..."
          type="text"
          value={source}
        />
      </label>
      <button className="primaryButton" onClick={copyLink} type="button">
        {copied ? "Copied" : "Copy Link"}
      </button>
    </div>
  );
}
