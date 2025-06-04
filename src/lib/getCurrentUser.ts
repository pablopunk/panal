import { getSession, getSessionIdFromCookie } from "./auth";

export function getCurrentUser(Astro: Astro): string | null {
  const cookie = Astro.request.headers.get("cookie") || undefined;
  const sessionId = getSessionIdFromCookie(cookie);
  if (!sessionId) return null;
  return getSession(sessionId) || null;
}
