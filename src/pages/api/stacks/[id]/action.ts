import type { APIRoute } from "astro";
import { runStackAction } from "../../../../lib/docker/services";

export const POST: APIRoute = async ({ params, request }) => {
	const { id } = params;
	if (!id || typeof id !== "string") {
		return new Response(
			JSON.stringify({ success: false, message: "Missing stack id" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const { action } = await request.json();
	const result = await runStackAction({ id, action });
	if (result.success) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}
	return new Response(
		JSON.stringify({ success: false, message: result.message }),
		{ status: 400, headers: { "Content-Type": "application/json" } },
	);
};
