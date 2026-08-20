import {
  listPocketBaseRecords,
  normalizePocketBaseDate,
  pocketBaseFilterValue,
} from "@/lib/pocketbase";

export type PollOption = {
  id: string;
  label: string;
};

export type Poll = {
  recordId: string;
  codename: string;
  name: string;
  question: string;
  description: string;
  stage: string;
  audience: string;
  status: "draft" | "open" | "closed";
  expiresAt: string;
  minSelections: number;
  maxSelections: number;
  correctAnswerIds: string[];
  options: PollOption[];
};

type PocketBasePollRecord = {
  id: string;
  codename: string;
  name: string;
  question: string;
  description?: string;
  stage?: string;
  audience?: string;
  status: "draft" | "open" | "closed";
  expiresAt: string;
  minSelections: number;
  maxSelections: number;
  correctAnswerIds?: unknown;
  options?: unknown;
};

function asPollOptions(value: unknown): PollOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "label" in item &&
      typeof item.id === "string" &&
      typeof item.label === "string"
    ) {
      return [{ id: item.id, label: item.label }];
    }

    return [];
  });
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function pollFromPocketBase(record: PocketBasePollRecord): Poll {
  return {
    recordId: record.id,
    codename: record.codename,
    name: record.name,
    question: record.question,
    description: record.description || "",
    stage: record.stage || "",
    audience: record.audience || "",
    status: record.status,
    expiresAt: normalizePocketBaseDate(record.expiresAt),
    minSelections: Number(record.minSelections || 1),
    maxSelections: Number(record.maxSelections || 1),
    correctAnswerIds: asStringArray(record.correctAnswerIds),
    options: asPollOptions(record.options),
  };
}

export async function getPoll(codename: string) {
  const response = await listPocketBaseRecords<PocketBasePollRecord>("polls", {
    filter: `codename=${pocketBaseFilterValue(codename)}`,
    page: 1,
    perPage: 1,
  });

  const record = response.items[0];
  return record ? pollFromPocketBase(record) : null;
}

export function isExpired(poll: Poll, now = new Date()) {
  return (
    poll.status !== "open" || now.getTime() > new Date(poll.expiresAt).getTime()
  );
}

export function isCorrectSelection(poll: Poll, selectedOptionIds: string[]) {
  if (poll.correctAnswerIds.length === 0) {
    return false;
  }

  const expected = [...poll.correctAnswerIds].sort();
  const actual = [...new Set(selectedOptionIds)].sort();

  return (
    expected.length === actual.length &&
    expected.every((optionId, index) => optionId === actual[index])
  );
}
