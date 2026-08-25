import { getLocale, withLocale } from "@/i18n/locales";
import {
  adminCookieName,
  adminCookieOptions,
  authenticateAdmin,
  getSafeRedirectPath,
} from "@/lib/admin-auth";
import { redirectTo } from "@/lib/redirect";

function formValue(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function POST(request: Request) {
  const form = await request.formData();
  const identity = formValue(form, "email");
  const password = formValue(form, "password");
  const locale = getLocale(form.get("locale"));
  const nextPath = getSafeRedirectPath(formValue(form, "next"));

  const session = await authenticateAdmin(identity, password);

  if (!session) {
    const params = new URLSearchParams({ error: "1" });

    if (nextPath !== "/") {
      params.set("next", nextPath);
    }

    return redirectTo(withLocale(locale, `/admin/login?${params.toString()}`));
  }

  const response = redirectTo(nextPath);

  response.cookies.set(adminCookieName, session.token, adminCookieOptions());

  return response;
}
