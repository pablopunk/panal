import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";

const STACKS_LOCATION = process.env.STACKS_LOCATION || "./stacks";

export const GET: APIRoute = async ({ params }) => {
	const { id } = params;
	if (!id || typeof id !== "string") {
		return new Response(
			JSON.stringify({ success: false, log: "", message: "Missing stack id" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
	const logPath = path.join(STACKS_LOCATION, id, "deploy.log");
	try {
		const log = await fs.readFile(logPath, "utf-8");
		return new Response(JSON.stringify({ success: true, log }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch {
		return new Response(JSON.stringify({ success: false, log: "" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}
};
