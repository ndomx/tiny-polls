import { notFound, redirect } from "next/navigation";
import { AdminPollForm } from "@/components/admin-poll-form";
import { getDictionary, getErrorMessage } from "@/i18n/get-dictionary";
import { isLocale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type NewPollPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<NewPollPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function NewPollPage({
  params,
  searchParams,
}: NewPollPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const session = await getAdminSession();

  if (!session) {
    redirect(
      withLocale(
        locale,
        `/admin/login?next=${encodeURIComponent(
          withLocale(locale, "/admin/polls/new"),
        )}`,
      ),
    );
  }

  const query = await searchParams;
  const error = getParam(query, "error");

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div>
          <p className="eyebrow">{dictionary.common.admin}</p>
          <h1>{dictionary.newPoll.title}</h1>
          <p>{dictionary.newPoll.description}</p>
        </div>
      </section>

      <section className="adminPanel">
        <AdminPollForm
          action="/api/admin/polls"
          dictionary={dictionary}
          error={error ? getErrorMessage(dictionary, error) : ""}
          locale={locale}
          mode="create"
        />
      </section>
    </main>
  );
}
