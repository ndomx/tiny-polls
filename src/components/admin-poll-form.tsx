import Link from "next/link";
import { AdminOptionsEditor } from "@/components/admin-options-editor";
import type { Poll, PollOption } from "@/lib/polls";

type AdminPollFormProps = {
  action: string;
  error?: string;
  mode: "create" | "edit";
  poll?: Poll;
};

function dateTimeLocalValue(value?: string) {
  const date = value
    ? new Date(value)
    : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function optionRows(poll?: Poll) {
  const rows: (PollOption | null)[] = poll ? [...poll.options] : [];

  while (rows.length < 8) {
    rows.push(null);
  }

  return rows.slice(0, 8);
}

export function AdminPollForm({
  action,
  error = "",
  mode,
  poll,
}: AdminPollFormProps) {
  return (
    <form action={action} className="adminPollForm" method="post">
      {error ? <p className="closedNotice">{error}</p> : null}

      <div className="formGrid">
        <label className="field">
          <span>Codename</span>
          <input
            defaultValue={poll?.codename || ""}
            maxLength={120}
            name="codename"
            pattern="[a-z0-9][a-z0-9-]{1,119}"
            readOnly={mode === "edit"}
            required
            type="text"
          />
        </label>

        <label className="field">
          <span>Status</span>
          <select defaultValue={poll?.status || "draft"} name="status" required>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Name</span>
        <input
          defaultValue={poll?.name || ""}
          maxLength={160}
          name="name"
          required
          type="text"
        />
      </label>

      <label className="field">
        <span>Question</span>
        <textarea
          defaultValue={poll?.question || ""}
          maxLength={500}
          name="question"
          required
          rows={3}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          defaultValue={poll?.description || ""}
          maxLength={1000}
          name="description"
          rows={3}
        />
      </label>

      <div className="formGrid">
        <label className="field">
          <span>Stage</span>
          <input
            defaultValue={poll?.stage || ""}
            maxLength={120}
            name="stage"
            type="text"
          />
        </label>

        <label className="field">
          <span>Audience</span>
          <input
            defaultValue={poll?.audience || ""}
            maxLength={160}
            name="audience"
            type="text"
          />
        </label>

        <label className="field">
          <span>Closes</span>
          <input
            defaultValue={dateTimeLocalValue(poll?.expiresAt)}
            name="expiresAt"
            required
            type="datetime-local"
          />
        </label>
      </div>

      <AdminOptionsEditor
        correctAnswerId={poll?.correctAnswerIds[0]}
        options={optionRows(poll)}
      />

      <div className="formActions">
        <button className="primaryButton" type="submit">
          {mode === "create" ? "Create Poll" : "Save Poll"}
        </button>
        <Link className="secondaryButton" href="/admin">
          Cancel
        </Link>
      </div>
    </form>
  );
}
