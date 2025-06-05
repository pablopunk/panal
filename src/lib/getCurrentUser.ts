import { getSession, getSessionIdFromCookie } from "./auth";

export async function getCurrentUser(Astro: Astro): Promise<string | null> {
  const cookie = Astro.request.headers.get("cookie") || undefined;
  const sessionId = getSessionIdFromCookie(cookie);
  if (!sessionId) return null;
  const username = await getSession(sessionId);
  return username || null;
}
