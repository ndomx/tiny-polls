export function getSiteUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  return process.env.PORT
    ? `http://localhost:${process.env.PORT}`
    : "http://localhost";
}
