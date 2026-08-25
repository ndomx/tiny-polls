import {
  listPocketBaseRecords,
  normalizePocketBaseDate,
  pocketBaseFilterValue,
  pocketBaseRequest,
} from "@/lib/pocketbase";
import {
  asStringArray,
  getPoll,
  isCorrectSelection,
  type Poll,
} from "@/lib/polls";

export type Submission = {
  id: string;
  pollCodename: string;
  voterId: string;
  voterName: string;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  selectedOptions: string[];
  isCorrect: boolean;
  createdAt: string;
};

export type SubmissionInput = {
  voterId: string;
  voterName: string;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  selectedOptionIds: string[];
  userAgent: string;
};

export type ResultOption = {
  id: string;
  label: string;
  count: number;
};

export type HistoryPoint = {
  at: string;
  counts: Record<string, number>;
};

export type ResultsPayload = {
  poll: Poll;
  totalVotes: number;
  options: ResultOption[];
  history: HistoryPoint[];
  sources: { source: string; count: number }[];
  submissions?: Submission[];
};

export type SubmissionErrorCode = "nameRequired" | "invalidAnswerCount";

type PocketBaseSubmissionRecord = {
  id: string;
  pollCodename: string;
  voterId: string;
  voterName: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  selectedOptionIds?: unknown;
  isCorrect?: boolean;
  submittedAt: string;
};

type PocketBaseCollectionField = Record<string, unknown> & {
  name?: string;
  required?: boolean;
};

type PocketBaseCollectionSchema = {
  fields?: PocketBaseCollectionField[];
};

let submissionSchemaChecked = false;

function normalizeSubmission(record: PocketBaseSubmissionRecord): Submission {
  return {
    id: record.id,
    pollCodename: record.pollCodename,
    voterId: record.voterId,
    voterName: record.voterName,
    source: record.source || "direct",
    utmSource: record.utmSource || "",
    utmMedium: record.utmMedium || "",
    utmCampaign: record.utmCampaign || "",
    selectedOptions: asStringArray(record.selectedOptionIds),
    isCorrect: Boolean(record.isCorrect),
    createdAt: normalizePocketBaseDate(record.submittedAt),
  };
}

async function ensureSubmissionSchemaAllowsIncorrectAnswers() {
  if (submissionSchemaChecked) {
    return;
  }

  const collection = await pocketBaseRequest<PocketBaseCollectionSchema>(
    "/api/collections/submissions",
    { cache: "no-store" },
  );
  const fields = collection.fields || [];
  const isCorrect = fields.find((field) => field.name === "isCorrect");

  if (isCorrect?.required) {
    await pocketBaseRequest("/api/collections/submissions", {
      method: "PATCH",
      cache: "no-store",
      body: JSON.stringify({
        fields: fields.map((field) =>
          field.name === "isCorrect" ? { ...field, required: false } : field,
        ),
      }),
    });
  }

  submissionSchemaChecked = true;
}

function isCorrectRequiredError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes('"isCorrect"') &&
    error.message.includes("validation_required")
  );
}

async function saveSubmissionRecord(
  existing: Submission | null,
  submission: Record<string, unknown>,
) {
  if (existing) {
    await pocketBaseRequest(
      `/api/collections/submissions/records/${existing.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(submission),
      },
    );
    return;
  }

  await pocketBaseRequest("/api/collections/submissions/records", {
    method: "POST",
    body: JSON.stringify(submission),
  });
}

export async function getSubmissionForVoter(poll: Poll, voterId: string) {
  if (!voterId) {
    return null;
  }

  const response = await listPocketBaseRecords<PocketBaseSubmissionRecord>(
    "submissions",
    {
      filter: `poll=${pocketBaseFilterValue(poll.recordId)} && voterId=${pocketBaseFilterValue(
        voterId,
      )}`,
      page: 1,
      perPage: 1,
      sort: "-submittedAt,-id",
    },
  );

  const record = response.items[0];
  return record ? normalizeSubmission(record) : null;
}

export function validateSubmission(poll: Poll, input: SubmissionInput) {
  const selectedOptionIds = [
    ...new Set(
      input.selectedOptionIds.filter((optionId) =>
        poll.options.some((option) => option.id === optionId),
      ),
    ),
  ];

  if (!input.voterName.trim()) {
    return { errorCode: "nameRequired" as const };
  }

  if (
    selectedOptionIds.length < poll.minSelections ||
    selectedOptionIds.length > poll.maxSelections
  ) {
    return { errorCode: "invalidAnswerCount" as const };
  }

  return { selectedOptionIds };
}

export async function saveSubmission(poll: Poll, input: SubmissionInput) {
  const validation = validateSubmission(poll, input);

  if ("errorCode" in validation) {
    return validation;
  }

  const submission = {
    poll: poll.recordId,
    pollCodename: poll.codename,
    voterId: input.voterId,
    voterName: input.voterName.trim(),
    source: input.source.trim() || "direct",
    utmSource: input.utmSource.trim(),
    utmMedium: input.utmMedium.trim(),
    utmCampaign: input.utmCampaign.trim(),
    selectedOptionIds: validation.selectedOptionIds,
    isCorrect: isCorrectSelection(poll, validation.selectedOptionIds),
    submittedAt: new Date().toISOString(),
    userAgent: input.userAgent,
  };

  const existing = await getSubmissionForVoter(poll, input.voterId);
  await ensureSubmissionSchemaAllowsIncorrectAnswers();

  try {
    await saveSubmissionRecord(existing, submission);
  } catch (error) {
    if (!isCorrectRequiredError(error)) {
      throw error;
    }

    submissionSchemaChecked = false;
    await ensureSubmissionSchemaAllowsIncorrectAnswers();
    await saveSubmissionRecord(existing, submission);
  }

  return { ok: true };
}

export async function getResults(codename: string, includePrivate = false) {
  const poll = await getPoll(codename);

  if (!poll) {
    return null;
  }

  const response = await listPocketBaseRecords<PocketBaseSubmissionRecord>(
    "submissions",
    {
      filter: `poll=${pocketBaseFilterValue(poll.recordId)}`,
      page: 1,
      perPage: 500,
      sort: "submittedAt,id",
    },
  );
  const submissions = response.items.map(normalizeSubmission);
  const counts = Object.fromEntries(
    poll.options.map((option) => [option.id, 0]),
  );
  const sourceCounts = new Map<string, number>();
  const history: HistoryPoint[] = [];

  for (const submission of submissions) {
    for (const optionId of submission.selectedOptions) {
      if (optionId in counts) {
        counts[optionId] += 1;
      }
    }

    sourceCounts.set(
      submission.source,
      (sourceCounts.get(submission.source) || 0) + 1,
    );
    history.push({ at: submission.createdAt, counts: { ...counts } });
  }

  const payload: ResultsPayload = {
    poll,
    totalVotes: submissions.length,
    options: poll.options.map((option) => ({
      ...option,
      count: counts[option.id] || 0,
    })),
    history,
    sources: [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  };

  if (includePrivate) {
    payload.submissions = [...submissions].reverse();
  }

  return payload;
}
