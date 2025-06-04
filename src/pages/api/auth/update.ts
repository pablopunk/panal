import type { APIRoute } from "astro";
import {
  getSession,
  getSessionIdFromCookie,
  hashPassword,
} from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const POST: APIRoute = async ({ request }) => {
  const cookie = request.headers.get("cookie") || undefined;
  const sessionId = getSessionIdFromCookie(cookie);
  if (!sessionId) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const currentUsername = getSession(sessionId);
  if (!currentUsername) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const db = await getDb();
  const user = db.users.find((u) => u.username === currentUsername);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, message: "User not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const data = await request.json();
  const { username, newPassword } = data;
  if (username) user.username = username;
  if (newPassword) user.passwordHash = hashPassword(newPassword);
  // Save updated db
  await import("../../../lib/db").then((m) => m.saveDb(db));
  return new Response(
    JSON.stringify({ success: true, message: "User updated" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
