import { getLocale, type Locale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";
import { createPoll } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";

function redirectWithError(locale: Locale, error: string) {
  const params = new URLSearchParams({ error });
  return redirectTo(
    withLocale(locale, `/admin/polls/new?${params.toString()}`),
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const locale = getLocale(form.get("locale"));
  const session = await getAdminSession();

  if (!session) {
    return redirectTo(
      withLocale(
        locale,
        `/admin/login?next=${encodeURIComponent(
          withLocale(locale, "/admin/polls/new"),
        )}`,
      ),
    );
  }

  const result = await createPoll(form);

  if ("errorCode" in result) {
    return redirectWithError(locale, result.errorCode);
  }

  return redirectTo(withLocale(locale, "/admin"));
}
