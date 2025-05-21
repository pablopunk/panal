import type { APIRoute } from "astro";
import { destroySession, getSessionIdFromCookie } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
	const cookie = request.headers.get("cookie") || undefined;
	const sessionId = getSessionIdFromCookie(cookie);
	if (sessionId) destroySession(sessionId);
	return new Response(
		JSON.stringify({ success: true, message: "Logged out" }),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
				// Expire the cookie
				"Set-Cookie":
					"panal_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure",
			},
		},
	);
}; 