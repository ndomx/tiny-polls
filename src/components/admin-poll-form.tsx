import Link from "next/link";
import { AdminOptionsEditor } from "@/components/admin-options-editor";
import type { Dictionary } from "@/i18n/get-dictionary";
import { type Locale, withLocale } from "@/i18n/locales";
import type { Poll, PollOption } from "@/lib/polls";

type AdminPollFormProps = {
  action: string;
  dictionary: Dictionary;
  error?: string;
  locale: Locale;
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
  dictionary,
  error = "",
  locale,
  mode,
  poll,
}: AdminPollFormProps) {
  const { common, optionsEditor, pollForm } = dictionary;

  return (
    <form action={action} className="adminPollForm" method="post">
      <input name="locale" type="hidden" value={locale} />
      {error ? <p className="closedNotice">{error}</p> : null}

      <div className="formGrid">
        <label className="field">
          <span>{pollForm.codename}</span>
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
          <span>{pollForm.status}</span>
          <select defaultValue={poll?.status || "draft"} name="status" required>
            <option value="draft">{pollForm.statusDraft}</option>
            <option value="open">{pollForm.statusOpen}</option>
            <option value="closed">{pollForm.statusClosed}</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>{pollForm.name}</span>
        <input
          defaultValue={poll?.name || ""}
          maxLength={160}
          name="name"
          required
          type="text"
        />
      </label>

      <label className="field">
        <span>{pollForm.question}</span>
        <textarea
          defaultValue={poll?.question || ""}
          maxLength={500}
          name="question"
          required
          rows={3}
        />
      </label>

      <label className="field">
        <span>{pollForm.description}</span>
        <textarea
          defaultValue={poll?.description || ""}
          maxLength={1000}
          name="description"
          rows={3}
        />
      </label>

      <div className="formGrid">
        <label className="field">
          <span>{pollForm.stage}</span>
          <input
            defaultValue={poll?.stage || ""}
            maxLength={120}
            name="stage"
            type="text"
          />
        </label>

        <label className="field">
          <span>{pollForm.audience}</span>
          <input
            defaultValue={poll?.audience || ""}
            maxLength={160}
            name="audience"
            type="text"
          />
        </label>

        <label className="field">
          <span>{pollForm.closes}</span>
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
        labels={{
          addOption: optionsEditor.addOption,
          answers: optionsEditor.answers,
          correct: optionsEditor.correct,
          option: optionsEditor.option,
          removeOption: optionsEditor.removeOption,
          setLater: optionsEditor.setLater,
        }}
        options={optionRows(poll)}
      />

      <div className="formActions">
        <button className="primaryButton" type="submit">
          {mode === "create" ? pollForm.createPoll : pollForm.savePoll}
        </button>
        <Link className="secondaryButton" href={withLocale(locale, "/admin")}>
          {common.cancel}
        </Link>
      </div>
    </form>
  );
}
