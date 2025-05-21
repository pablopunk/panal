import type { APIRoute } from "astro";
import { createSession, verifyPassword } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();
		const { username, password } = data;

		if (!username || !password) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Username and password are required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const isValid = await verifyPassword(username, password);

		if (!isValid) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid username or password",
				}),
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Create session and set cookie
		const sessionId = createSession(username);
		return new Response(
			JSON.stringify({ success: true, message: "Login successful" }),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": `panal_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Secure`,
				},
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ success: false, message: "Server error" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
