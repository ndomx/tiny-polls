import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminCookieOptions,
  authenticateAdmin,
  getSafeRedirectPath,
} from "@/lib/admin-auth";

function formValue(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

export async function POST(request: Request) {
  const form = await request.formData();
  const identity = formValue(form, "email");
  const password = formValue(form, "password");
  const nextPath = getSafeRedirectPath(formValue(form, "next"));

  const session = await authenticateAdmin(identity, password);

  if (!session) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");

    if (nextPath !== "/") {
      url.searchParams.set("next", nextPath);
    }

    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), {
    status: 303,
  });

  response.cookies.set(adminCookieName, session.token, adminCookieOptions());

  return response;
}
