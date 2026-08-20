import { randomUUID } from "node:crypto";

export const voterCookieName = "tiny_polls_voter_id";

export function isValidVoterId(value: string | undefined): value is string {
  return /^[a-f0-9-]{36}$/i.test(value || "");
}

export function createVoterId() {
  return randomUUID();
}

export function getOrCreateVoterId(value: string | undefined) {
  return isValidVoterId(value) ? value : createVoterId();
}

export function shortVoterId(voterId: string) {
  return voterId ? voterId.slice(0, 8) : "unknown";
}
