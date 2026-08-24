import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
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
  const path = "/api/collections/_superusers/auth-with-password";
  const url = pocketbaseUrl(path);
  const startedAt = Date.now();

  logger.info({ path, url }, "Admin login authentication started");

  let response: Response;

  try {
    response = await fetch(url, {
      body: JSON.stringify({ identity, password }),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch (err) {
    logger.error(
      { durationMs: Date.now() - startedAt, err, path, url },
      "Admin login authentication request failed",
    );
    throw err;
  }

  if (!response.ok) {
    logger.warn(
      {
        durationMs: Date.now() - startedAt,
        path,
        status: response.status,
        url,
      },
      "Admin login authentication rejected",
    );
    return null;
  }

  logger.info(
    { durationMs: Date.now() - startedAt, path, status: response.status },
    "Admin login authentication succeeded",
  );

  return sessionFromResponse((await response.json()) as PocketBaseAuthResponse);
}

export async function validateAdminToken(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) {
    return null;
  }

  const path = "/api/collections/_superusers/auth-refresh";
  const url = pocketbaseUrl(path);
  const startedAt = Date.now();

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: { Authorization: token },
      method: "POST",
    });
  } catch (err) {
    logger.error(
      { durationMs: Date.now() - startedAt, err, path, url },
      "Admin token validation request failed",
    );
    throw err;
  }

  if (!response.ok) {
    logger.debug(
      {
        durationMs: Date.now() - startedAt,
        path,
        status: response.status,
        url,
      },
      "Admin token validation rejected",
    );
    return null;
  }

  logger.debug(
    { durationMs: Date.now() - startedAt, path, status: response.status },
    "Admin token validation succeeded",
  );

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
