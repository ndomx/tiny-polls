import { notFound, redirect } from "next/navigation";
import { AdminPollForm } from "@/components/admin-poll-form";
import { Notice } from "@/components/notice";
import { getDictionary, getErrorMessage } from "@/i18n/get-dictionary";
import { isLocale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";
import { getPoll } from "@/lib/polls";

export const dynamic = "force-dynamic";

type EditPollPageProps = {
  params: Promise<{ codename: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<EditPollPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function EditPollPage({
  params,
  searchParams,
}: EditPollPageProps) {
  const { codename, locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const session = await getAdminSession();
  const editPath = withLocale(
    locale,
    `/admin/polls/${encodeURIComponent(codename)}/edit`,
  );

  if (!session) {
    redirect(
      withLocale(locale, `/admin/login?next=${encodeURIComponent(editPath)}`),
    );
  }

  const poll = await getPoll(codename);

  if (!poll) {
    return (
      <Notice
        eyebrow={dictionary.common.admin}
        title={dictionary.notice.pollNotFoundTitle}
        message={dictionary.notice.pollNotEditableMessage}
      />
    );
  }

  const query = await searchParams;
  const error = getParam(query, "error");

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">{dictionary.common.admin}</p>
          <h1>{dictionary.editPoll.title}</h1>
          <p>{poll.name}</p>
        </div>
      </section>

      <section className="adminPanel">
        <AdminPollForm
          action={`/api/admin/polls/${encodeURIComponent(poll.codename)}/update`}
          dictionary={dictionary}
          error={error ? getErrorMessage(dictionary, error) : ""}
          locale={locale}
          mode="edit"
          poll={poll}
        />
      </section>
    </main>
  );
}
