import { getLocale, withLocale } from "@/i18n/locales";
import { adminCookieName, adminCookieOptions } from "@/lib/admin-auth";
import { redirectTo } from "@/lib/redirect";

export async function POST(request: Request) {
  const form = await request.formData();
  const locale = getLocale(form.get("locale"));
  const response = redirectTo(withLocale(locale, "/admin/login"));

  response.cookies.set(adminCookieName, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });

  return response;
}
