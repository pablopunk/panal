import type { APIRoute } from "astro";
import { getSession, getSessionIdFromCookie } from "../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
	const cookie = request.headers.get("cookie") || undefined;
	const sessionId = getSessionIdFromCookie(cookie);
	if (!sessionId) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
	const username = getSession(sessionId);
	if (!username) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
	return new Response(JSON.stringify({ username }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
