import { adminCookieName, adminCookieOptions } from "@/lib/admin-auth";
import { redirectTo } from "@/lib/redirect";

export async function POST() {
  const response = redirectTo("/admin/login");

  response.cookies.set(adminCookieName, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });

  return response;
}
