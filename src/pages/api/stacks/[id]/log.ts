import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";

const STACKS_LOCATION = process.env.STACKS_LOCATION || "./stacks";

export const GET: APIRoute = async ({ params, request }) => {
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
	const url = new URL(request.url);
	const sinceParam = url.searchParams.get("since");
	let since = 0;
	if (sinceParam && !Number.isNaN(Number(sinceParam))) {
		since = Number(sinceParam);
	}
	try {
		const stat = await fs.stat(logPath);
		const fileSize = stat.size;
		if (since >= fileSize) {
			// No new data
			return new Response(
				JSON.stringify({ success: true, log: "", offset: fileSize }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		const fileHandle = await fs.open(logPath, "r");
		const length = fileSize - since;
		const buffer = Buffer.alloc(length);
		await fileHandle.read(buffer, 0, length, since);
		await fileHandle.close();
		return new Response(
			JSON.stringify({
				success: true,
				log: buffer.toString(),
				offset: fileSize,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch {
		return new Response(
			JSON.stringify({ success: false, log: "", offset: 0 }),
			{
				status: 404,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
