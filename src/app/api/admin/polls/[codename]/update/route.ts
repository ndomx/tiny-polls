import { getLocale, type Locale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";
import { updatePoll } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";

type UpdatePollRouteContext = {
  params: Promise<{ codename: string }>;
};

function editPath(locale: Locale, codename: string) {
  return withLocale(
    locale,
    `/admin/polls/${encodeURIComponent(codename)}/edit`,
  );
}

function redirectWithError(locale: Locale, codename: string, error: string) {
  const params = new URLSearchParams({ error });
  return redirectTo(`${editPath(locale, codename)}?${params.toString()}`);
}

export async function POST(request: Request, context: UpdatePollRouteContext) {
  const { codename } = await context.params;
  const form = await request.formData();
  const locale = getLocale(form.get("locale"));
  const session = await getAdminSession();

  if (!session) {
    return redirectTo(
      withLocale(
        locale,
        `/admin/login?next=${encodeURIComponent(editPath(locale, codename))}`,
      ),
    );
  }

  const result = await updatePoll(codename, form);

  if ("errorCode" in result) {
    return redirectWithError(locale, codename, result.errorCode);
  }

  return redirectTo(withLocale(locale, "/admin"));
}
