import { getLocale, withLocale } from "@/i18n/locales";
import { getAdminSession } from "@/lib/admin-auth";
import { closePoll } from "@/lib/polls";
import { redirectTo } from "@/lib/redirect";

type ClosePollRouteContext = {
  params: Promise<{ codename: string }>;
};

export async function POST(request: Request, context: ClosePollRouteContext) {
  const form = await request.formData();
  const locale = getLocale(form.get("locale"));
  const session = await getAdminSession();

  if (!session) {
    return redirectTo(
      withLocale(
        locale,
        `/admin/login?next=${encodeURIComponent(withLocale(locale, "/admin"))}`,
      ),
    );
  }

  const { codename } = await context.params;
  await closePoll(codename);

  return redirectTo(withLocale(locale, "/admin"));
}
