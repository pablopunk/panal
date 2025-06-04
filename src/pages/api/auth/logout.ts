import type { APIRoute } from "astro";
import { destroySession, getSessionIdFromCookie } from "../../../lib/auth";
import { logger } from "../../../lib/logger";

export const POST: APIRoute = async ({ request }) => {
	logger.info("POST /api/auth/logout called");
	try {
		const cookie = request.headers.get("cookie") || undefined;
		const sessionId = getSessionIdFromCookie(cookie);
		logger.debug("Logout request sessionId", { sessionId });
		if (sessionId) await destroySession(sessionId);
		logger.info("Logout successful", { sessionId });
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
	} catch (err) {
		logger.error("Failed to logout", err);
		return new Response("Failed to logout", { status: 500 });
	}
};
