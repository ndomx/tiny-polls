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

export function appConfig() {
  return {
    pocketbaseUrl: (
      process.env.POCKETBASE_URL || "http://127.0.0.1:8090"
    ).replace(/\/$/, ""),
    pocketbaseEmail: process.env.POCKETBASE_SUPERUSER_EMAIL || "",
    pocketbasePassword: process.env.POCKETBASE_SUPERUSER_PASSWORD || "",
  };
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
  const response = await fetch(
    pocketbaseUrl("/api/collections/_superusers/auth-with-password"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: config.pocketbaseEmail,
        password: config.pocketbasePassword,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`PocketBase login failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as { token: string };
  cachedToken = body.token;
  cachedTokenExpiresAt = now + 1000 * 60 * 30;
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

  const response = await fetch(pocketbaseUrl(path), {
    ...requestOptions,
    headers,
  });

  if (response.status === 401 && !skipAuth) {
    cachedToken = "";
    cachedTokenExpiresAt = 0;
    return pocketBaseRequest<T>(path, options);
  }

  if (!response.ok) {
    throw new Error(
      `PocketBase request failed with HTTP ${response.status}: ${await response.text()}`,
    );
  }

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
