import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/locales";

function preferredLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(localeCookieName)?.value;

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameLocale = pathname.split("/")[1] || "";

  if (isLocale(pathnameLocale)) {
    const response = NextResponse.next();
    response.cookies.set(localeCookieName, pathnameLocale, {
      maxAge: 31536000,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/((?!api|_next|.*\\..*).*)",
};
