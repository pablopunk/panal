import type { APIRoute } from "astro";
import { runStackDeployOrUpdate } from "../../../lib/docker/services";

function isValidStackName(name: string) {
	return /^[a-zA-Z0-9_-]+$/.test(name);
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const { name, compose, env } = await request.json();
		if (!name || !compose) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Name and compose.yml are required.",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}
		if (!isValidStackName(name)) {
			return new Response(
				JSON.stringify({
					success: false,
					message:
						"Invalid stack name. Use only letters, numbers, dashes, and underscores.",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}
		// Check if stack already exists
		const result = await runStackDeployOrUpdate({
			id: name,
			name,
			compose,
			env,
		});
		if (result.success) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response(
			JSON.stringify({ success: false, message: result.message }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ success: false, message: "Failed to create stack." }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
