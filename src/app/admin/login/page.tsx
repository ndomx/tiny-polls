import { redirect } from "next/navigation";
import { getAdminSession, getSafeRedirectPath } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Awaited<LoginPageProps["searchParams"]>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const nextPath = getSafeRedirectPath(getParam(query, "next"));
  const hasError = getParam(query, "error") === "1";
  const session = await getAdminSession();

  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="centerPage">
      <section className="noticePanel adminLoginPanel">
        <p className="eyebrow">Admin</p>
        <h1>Sign in</h1>
        <form
          action="/api/admin/login"
          className="adminLoginForm"
          method="post"
        >
          <input name="next" type="hidden" value={nextPath} />
          <label className="field">
            <span>Email</span>
            <input autoComplete="username" name="email" required type="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          {hasError ? (
            <p className="closedNotice">
              PocketBase rejected those credentials.
            </p>
          ) : null}
          <button className="primaryButton" type="submit">
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
