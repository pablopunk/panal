import type { APIRoute } from "astro";
import { validateUser } from "../../../lib/auth";

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

		const isValid = validateUser(username, password);

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

		// In a real app, you would create a session or JWT token here

		return new Response(
			JSON.stringify({ success: true, message: "Login successful" }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
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
