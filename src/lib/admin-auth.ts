import { cookies } from "next/headers";
import { appConfig } from "@/lib/pocketbase";

export const adminCookieName = "tiny_polls_admin_auth";
export const adminSessionMaxAge = 60 * 60 * 24;

export type AdminSession = {
  id: string;
  email: string;
  token: string;
};

type PocketBaseAuthResponse = {
  token: string;
  record?: {
    id?: string;
    email?: string;
  };
};

function pocketbaseUrl(path: string) {
  return `${appConfig().pocketbaseUrl}${path}`;
}

function sessionFromResponse(
  body: PocketBaseAuthResponse,
): AdminSession | null {
  if (!body.token) {
    return null;
  }

  return {
    email: body.record?.email || "",
    id: body.record?.id || "",
    token: body.token,
  };
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: adminSessionMaxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function authenticateAdmin(
  identity: string,
  password: string,
): Promise<AdminSession | null> {
  const response = await fetch(
    pocketbaseUrl("/api/collections/_superusers/auth-with-password"),
    {
      body: JSON.stringify({ identity, password }),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );

  if (!response.ok) {
    return null;
  }

  return sessionFromResponse((await response.json()) as PocketBaseAuthResponse);
}

export async function validateAdminToken(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) {
    return null;
  }

  const response = await fetch(
    pocketbaseUrl("/api/collections/_superusers/auth-refresh"),
    {
      cache: "no-store",
      headers: { Authorization: token },
      method: "POST",
    },
  );

  if (!response.ok) {
    return null;
  }

  return sessionFromResponse((await response.json()) as PocketBaseAuthResponse);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return validateAdminToken(cookieStore.get(adminCookieName)?.value);
}

export function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
