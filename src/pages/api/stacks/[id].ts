import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { getStackById } from "../../../lib/docker/stacks";

const STACKS_LOCATION = process.env.STACKS_LOCATION || "./stacks";

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

export const DELETE: APIRoute = async ({ params }) => {
	const { id } = params;
	if (!id || typeof id !== "string") {
		return new Response(
			JSON.stringify({ success: false, message: "Missing stack id" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const stackDir = path.join(STACKS_LOCATION, id);
	try {
		// Stop the stack (ignore errors)
		await new Promise((resolve) => {
			const proc = spawn("docker", ["compose", "down"], { cwd: stackDir });
			proc.on("close", () => resolve(undefined));
		});
		// Remove the stack directory
		await fs.rm(stackDir, { recursive: true, force: true });
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ success: false, message: String(err) }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
