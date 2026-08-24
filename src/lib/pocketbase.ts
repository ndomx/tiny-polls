import { logger } from "@/lib/logger";

type PocketBaseListQuery = Record<string, string | number | boolean>;

export type PocketBaseListResponse<T> = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
};

type PocketBaseRequestOptions = RequestInit & {
  skipAuth?: boolean;
};

let cachedToken = "";
let cachedTokenExpiresAt = 0;
let hasLoggedPocketBaseConfig = false;

export function appConfig() {
  const rawPocketbaseUrl =
    process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
  const config = {
    pocketbaseUrl: (
      process.env.POCKETBASE_URL || "http://127.0.0.1:8090"
    ).replace(/\/$/, ""),
    pocketbaseEmail: process.env.POCKETBASE_SUPERUSER_EMAIL || "",
    pocketbasePassword: process.env.POCKETBASE_SUPERUSER_PASSWORD || "",
  };

  if (!hasLoggedPocketBaseConfig) {
    hasLoggedPocketBaseConfig = true;
    logger.info(
      {
        hasPocketbaseEmail: Boolean(config.pocketbaseEmail),
        hasPocketbasePassword: Boolean(config.pocketbasePassword),
        pocketbaseUrl: config.pocketbaseUrl,
        pocketbaseUrlContainsRailwayTemplate: rawPocketbaseUrl.includes("${{"),
        pocketbaseUrlRaw: rawPocketbaseUrl,
      },
      "PocketBase configuration loaded",
    );

    try {
      new URL(config.pocketbaseUrl);
    } catch (err) {
      logger.error(
        { err, pocketbaseUrl: config.pocketbaseUrl },
        "PocketBase URL is not a valid URL",
      );
    }
  }

  return config;
}

function requirePocketBaseCredentials() {
  const config = appConfig();

  if (!config.pocketbaseEmail || !config.pocketbasePassword) {
    throw new Error(
      "PocketBase credentials are missing. Set POCKETBASE_SUPERUSER_EMAIL and POCKETBASE_SUPERUSER_PASSWORD in .env.local.",
    );
  }

  return config;
}

function pocketbaseUrl(path: string) {
  return `${appConfig().pocketbaseUrl}${path}`;
}

async function authenticatePocketBase() {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now) {
    return cachedToken;
  }

  const config = requirePocketBaseCredentials();
  const path = "/api/collections/_superusers/auth-with-password";
  const url = pocketbaseUrl(path);
  const startedAt = Date.now();

  logger.debug({ path, url }, "Authenticating PocketBase superuser");

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: config.pocketbaseEmail,
        password: config.pocketbasePassword,
      }),
    });
  } catch (err) {
    logger.error(
      { durationMs: Date.now() - startedAt, err, path, url },
      "PocketBase superuser authentication request failed",
    );
    throw err;
  }

  if (!response.ok) {
    logger.error(
      {
        durationMs: Date.now() - startedAt,
        path,
        status: response.status,
        url,
      },
      "PocketBase superuser authentication failed",
    );
    throw new Error(`PocketBase login failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as { token: string };
  cachedToken = body.token;
  cachedTokenExpiresAt = now + 1000 * 60 * 30;
  logger.debug(
    { durationMs: Date.now() - startedAt, path, status: response.status, url },
    "PocketBase superuser authenticated",
  );
  return cachedToken;
}

export async function pocketBaseRequest<T>(
  path: string,
  options: PocketBaseRequestOptions = {},
): Promise<T> {
  const { skipAuth = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);

  if (!skipAuth) {
    headers.set("Authorization", await authenticatePocketBase());
  }

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = requestOptions.method || "GET";
  const url = pocketbaseUrl(path);
  const startedAt = Date.now();

  logger.debug({ method, path, skipAuth, url }, "PocketBase request started");

  let response: Response;

  try {
    response = await fetch(url, {
      ...requestOptions,
      headers,
    });
  } catch (err) {
    logger.error(
      { durationMs: Date.now() - startedAt, err, method, path, skipAuth, url },
      "PocketBase request failed before response",
    );
    throw err;
  }

  if (response.status === 401 && !skipAuth) {
    logger.warn(
      { durationMs: Date.now() - startedAt, method, path, status: 401, url },
      "PocketBase request returned 401; refreshing auth token",
    );
    cachedToken = "";
    cachedTokenExpiresAt = 0;
    return pocketBaseRequest<T>(path, options);
  }

  if (!response.ok) {
    const body = await response.text();
    logger.error(
      {
        body,
        durationMs: Date.now() - startedAt,
        method,
        path,
        status: response.status,
        url,
      },
      "PocketBase request returned an error response",
    );
    throw new Error(
      `PocketBase request failed with HTTP ${response.status}: ${body}`,
    );
  }

  logger.debug(
    {
      durationMs: Date.now() - startedAt,
      method,
      path,
      status: response.status,
    },
    "PocketBase request completed",
  );

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function listPocketBaseRecords<T>(
  collection: string,
  query: PocketBaseListQuery = {},
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    params.set(key, String(value));
  }

  return pocketBaseRequest<PocketBaseListResponse<T>>(
    `/api/collections/${collection}/records?${params.toString()}`,
  );
}

export function pocketBaseFilterValue(value: string) {
  return JSON.stringify(value);
}

export function normalizePocketBaseDate(value: string) {
  return /^\d{4}-\d{2}-\d{2} /.test(value) ? value.replace(" ", "T") : value;
}
