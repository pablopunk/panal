import type { APIRoute } from "astro";
import { getStackById } from "../../../lib/docker/stacks";

export const GET: APIRoute = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return new Response(
				JSON.stringify({ success: false, message: "Stack ID is required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const stack = await getStackById(id);

		if (!stack) {
			return new Response(
				JSON.stringify({ success: false, message: "Stack not found" }),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(JSON.stringify({ success: true, data: stack }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ success: false, message: "Failed to fetch stack" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
