import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";

const STACKS_LOCATION = process.env.STACKS_LOCATION || "./stacks";

export const POST: APIRoute = async ({ params, request }) => {
	const { id } = params;
	if (!id || typeof id !== "string") {
		return new Response(
			JSON.stringify({ success: false, message: "Missing stack id" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const { action } = await request.json();
	if (!["start", "stop", "restart"].includes(action)) {
		return new Response(
			JSON.stringify({ success: false, message: "Invalid action" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const stackDir = path.join(STACKS_LOCATION, id);
	const cmd = "docker";
	let args: string[] = [];
	if (action === "start") {
		args = ["compose", "up", "-d"];
	} else if (action === "stop") {
		args = ["compose", "down"];
	} else if (action === "restart") {
		args = ["compose", "restart"];
	}
	const logPath = path.join(stackDir, "deploy.log");
	try {
		// Overwrite the log file
		const logStream = await fs.open(logPath, "w");
		const proc = spawn(cmd, args, { cwd: stackDir });
		proc.stdout.on("data", (data) => {
			logStream.write(data);
		});
		proc.stderr.on("data", (data) => {
			logStream.write(data);
		});
		proc.on("close", async (code) => {
			await logStream.write(`\n[Process exited with code ${code}]\n`);
			await logStream.close();
		});
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