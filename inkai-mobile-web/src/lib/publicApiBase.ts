/**
 * Base URL untuk API `/v1`. Di production Vercel, set `NEXT_PUBLIC_API_URL`
 * (contoh: https://inkai-ecosystem.vercel.app/v1) agar domain kustom / preview tetap benar.
 */
export function getPublicApiV1Base(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://inkai-ecosystem.vercel.app/v1";
  }

  return "http://127.0.0.1:5001/v1";
}
