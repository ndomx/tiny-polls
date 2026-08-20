"use client";

import { useEffect } from "react";

export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      window.location.reload();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return null;
}
