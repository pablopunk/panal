import type { APIRoute } from "astro";
import { runStackAction } from "../../../../lib/docker/services";
import { logger } from "../../../../lib/logger";

export const POST: APIRoute = async ({ params, request }) => {
	logger.info("POST /api/stacks/[id]/action called", params.id);
	const { id } = params;
	if (!id || typeof id !== "string") {
		return new Response(
			JSON.stringify({ success: false, message: "Missing stack id" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const { action } = await request.json();
	try {
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
	} catch (err) {
		logger.error("Failed to perform stack action", err);
		return new Response("Failed to perform stack action", { status: 500 });
	}
};
