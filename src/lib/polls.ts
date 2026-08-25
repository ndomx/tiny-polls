import {
  listPocketBaseRecords,
  normalizePocketBaseDate,
  pocketBaseFilterValue,
  pocketBaseRequest,
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

export type PollMutationErrorCode =
  | "codenameInvalid"
  | "pollNameRequired"
  | "questionRequired"
  | "statusInvalid"
  | "closeTimeRequired"
  | "openPollNeedsFutureCloseTime"
  | "notEnoughOptions"
  | "correctAnswerInvalid"
  | "codenameTaken"
  | "pollNotFound";

export type PollMutationResult =
  | { errorCode: PollMutationErrorCode }
  | { ok: true; poll: Poll | null };

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

type PocketBaseSubmissionRecord = {
  id: string;
  selectedOptionIds?: unknown;
};

type PocketBaseCollectionField = Record<string, unknown> & {
  name?: string;
  required?: boolean;
};

type PocketBaseCollectionSchema = {
  fields?: PocketBaseCollectionField[];
};

type PollMutationInput = {
  codename: string;
  name: string;
  question: string;
  description: string;
  stage: string;
  audience: string;
  status: Poll["status"];
  expiresAt: string;
  options: PollOption[];
  correctAnswerIds: string[];
};

let pollSchemaChecked = false;

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

export async function listPolls() {
  const response = await listPocketBaseRecords<PocketBasePollRecord>("polls", {
    page: 1,
    perPage: 500,
    sort: "-expiresAt,name",
  });

  return response.items.map(pollFromPocketBase);
}

function formValue(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function asPollStatus(value: string): Poll["status"] | null {
  return value === "draft" || value === "open" || value === "closed"
    ? value
    : null;
}

function optionIdFromLabel(label: string, index: number, usedIds: Set<string>) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `option-${index + 1}`;
  let id = base;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
}

function pollInputFromForm(
  form: FormData,
  existingPoll?: Poll,
): { errorCode: PollMutationErrorCode } | { input: PollMutationInput } {
  const codename = existingPoll?.codename || formValue(form, "codename");
  const name = formValue(form, "name");
  const question = formValue(form, "question");
  const description = formValue(form, "description");
  const stage = formValue(form, "stage");
  const audience = formValue(form, "audience");
  const status = asPollStatus(formValue(form, "status"));
  const expiresAtInput = formValue(form, "expiresAt");
  const expiresAt = new Date(expiresAtInput);
  const correctOptionInput = formValue(form, "correctOption");
  const correctOption = Number(correctOptionInput);
  const optionRows: { rowIndex: number; option: PollOption }[] = [];
  const usedOptionIds = new Set<string>();

  if (!/^[a-z0-9][a-z0-9-]{1,119}$/.test(codename)) {
    return { errorCode: "codenameInvalid" };
  }

  if (!name) {
    return { errorCode: "pollNameRequired" };
  }

  if (!question) {
    return { errorCode: "questionRequired" };
  }

  if (!status) {
    return { errorCode: "statusInvalid" };
  }

  if (Number.isNaN(expiresAt.getTime())) {
    return { errorCode: "closeTimeRequired" };
  }

  if (status === "open" && expiresAt.getTime() <= Date.now()) {
    return { errorCode: "openPollNeedsFutureCloseTime" };
  }

  for (let index = 0; index < 8; index += 1) {
    const label = formValue(form, `optionLabel_${index}`);
    const existingId = formValue(form, `optionId_${index}`);

    if (!label) {
      continue;
    }

    optionRows.push({
      rowIndex: index,
      option: {
        id:
          existingId && !usedOptionIds.has(existingId)
            ? existingId
            : optionIdFromLabel(label, index, usedOptionIds),
        label,
      },
    });

    if (existingId) {
      usedOptionIds.add(existingId);
    }
  }

  const options = optionRows.map((row) => row.option);

  if (options.length < 2) {
    return { errorCode: "notEnoughOptions" };
  }

  const correctAnswer =
    correctOptionInput === ""
      ? null
      : optionRows.find((row) => row.rowIndex === correctOption)?.option;

  if (correctOptionInput !== "" && !/^\d+$/.test(correctOptionInput)) {
    return { errorCode: "correctAnswerInvalid" };
  }

  if (correctOptionInput !== "" && !correctAnswer) {
    return { errorCode: "correctAnswerInvalid" };
  }

  return {
    input: {
      audience,
      codename,
      correctAnswerIds: correctAnswer ? [correctAnswer.id] : [],
      description,
      expiresAt: expiresAt.toISOString(),
      name,
      options,
      question,
      stage,
      status,
    },
  };
}

function pollPayload(input: PollMutationInput) {
  return {
    audience: input.audience,
    codename: input.codename,
    correctAnswerIds: input.correctAnswerIds,
    description: input.description,
    expiresAt: input.expiresAt,
    maxSelections: 1,
    minSelections: 1,
    name: input.name,
    options: input.options,
    question: input.question,
    stage: input.stage,
    status: input.status,
  };
}

async function ensurePollSchemaAllowsDeferredCorrectAnswer() {
  if (pollSchemaChecked) {
    return;
  }

  const collection = await pocketBaseRequest<PocketBaseCollectionSchema>(
    "/api/collections/polls",
    { cache: "no-store" },
  );
  const fields = collection.fields || [];
  const correctAnswerIds = fields.find(
    (field) => field.name === "correctAnswerIds",
  );

  if (correctAnswerIds?.required) {
    await pocketBaseRequest("/api/collections/polls", {
      method: "PATCH",
      cache: "no-store",
      body: JSON.stringify({
        fields: fields.map((field) =>
          field.name === "correctAnswerIds"
            ? { ...field, required: false }
            : field,
        ),
      }),
    });
  }

  pollSchemaChecked = true;
}

function isCorrectAnswerIdsRequiredError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes('"correctAnswerIds"') &&
    error.message.includes("validation_required")
  );
}

async function createPollRecord(input: PollMutationInput) {
  await pocketBaseRequest("/api/collections/polls/records", {
    method: "POST",
    body: JSON.stringify(pollPayload(input)),
  });
}

async function updatePollRecord(poll: Poll, input: PollMutationInput) {
  await pocketBaseRequest(`/api/collections/polls/records/${poll.recordId}`, {
    method: "PATCH",
    body: JSON.stringify(pollPayload(input)),
  });
}

async function syncSubmissionCorrectness(poll: Poll) {
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await listPocketBaseRecords<PocketBaseSubmissionRecord>(
      "submissions",
      {
        filter: `poll=${pocketBaseFilterValue(poll.recordId)}`,
        page,
        perPage: 100,
      },
    );

    totalPages = response.totalPages;

    await Promise.all(
      response.items.map((submission) =>
        pocketBaseRequest(
          `/api/collections/submissions/records/${submission.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              isCorrect: isCorrectSelection(
                poll,
                asStringArray(submission.selectedOptionIds),
              ),
            }),
          },
        ),
      ),
    );

    page += 1;
  }
}

export async function createPoll(form: FormData): Promise<PollMutationResult> {
  const result = pollInputFromForm(form);

  if ("errorCode" in result) {
    return result;
  }

  const existing = await getPoll(result.input.codename);

  if (existing) {
    return { errorCode: "codenameTaken" };
  }

  await ensurePollSchemaAllowsDeferredCorrectAnswer();

  try {
    await createPollRecord(result.input);
  } catch (error) {
    if (!isCorrectAnswerIdsRequiredError(error)) {
      throw error;
    }

    pollSchemaChecked = false;
    await ensurePollSchemaAllowsDeferredCorrectAnswer();
    await createPollRecord(result.input);
  }

  return { ok: true, poll: await getPoll(result.input.codename) };
}

export async function updatePoll(
  codename: string,
  form: FormData,
): Promise<PollMutationResult> {
  const poll = await getPoll(codename);

  if (!poll) {
    return { errorCode: "pollNotFound" };
  }

  const result = pollInputFromForm(form, poll);

  if ("errorCode" in result) {
    return result;
  }

  await ensurePollSchemaAllowsDeferredCorrectAnswer();

  try {
    await updatePollRecord(poll, result.input);
  } catch (error) {
    if (!isCorrectAnswerIdsRequiredError(error)) {
      throw error;
    }

    pollSchemaChecked = false;
    await ensurePollSchemaAllowsDeferredCorrectAnswer();
    await updatePollRecord(poll, result.input);
  }

  const updatedPoll = await getPoll(codename);

  if (updatedPoll) {
    await syncSubmissionCorrectness(updatedPoll);
  }

  return { ok: true, poll: updatedPoll };
}

export async function closePoll(codename: string) {
  const poll = await getPoll(codename);

  if (!poll) {
    return null;
  }

  await pocketBaseRequest(`/api/collections/polls/records/${poll.recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "closed" }),
  });

  return poll;
}

export async function removePoll(codename: string) {
  const poll = await getPoll(codename);

  if (!poll) {
    return null;
  }

  await pocketBaseRequest(`/api/collections/polls/records/${poll.recordId}`, {
    method: "DELETE",
  });

  return poll;
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
