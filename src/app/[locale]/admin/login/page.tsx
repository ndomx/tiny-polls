import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale, withLocale } from "@/i18n/locales";
import { getAdminSession, getSafeRedirectPath } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<LoginPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const query = await searchParams;
  const nextParam = getParam(query, "next");
  const nextPath = nextParam
    ? getSafeRedirectPath(nextParam)
    : withLocale(locale, "/admin");
  const hasError = getParam(query, "error") === "1";
  const session = await getAdminSession();

  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="centerPage">
      <section className="noticePanel adminLoginPanel">
        <p className="eyebrow">{dictionary.common.admin}</p>
        <h1>{dictionary.login.title}</h1>
        <form
          action="/api/admin/login"
          className="adminLoginForm"
          method="post"
        >
          <input name="locale" type="hidden" value={locale} />
          <input name="next" type="hidden" value={nextPath} />
          <label className="field">
            <span>{dictionary.login.email}</span>
            <input autoComplete="username" name="email" required type="email" />
          </label>
          <label className="field">
            <span>{dictionary.login.password}</span>
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          {hasError ? (
            <p className="closedNotice">{dictionary.login.rejected}</p>
          ) : null}
          <button className="primaryButton" type="submit">
            {dictionary.login.submit}
          </button>
        </form>
      </section>
    </main>
  );
}
