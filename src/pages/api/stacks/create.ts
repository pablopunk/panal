import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { isSwarmActive } from "../../../lib/docker/services";

const STACKS_LOCATION = process.env.STACKS_LOCATION || "./stacks";

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
		const stackDir = path.join(STACKS_LOCATION, name);
		try {
			await fs.access(stackDir);
			return new Response(
				JSON.stringify({
					success: false,
					message: "A stack with this name already exists.",
				}),
				{ status: 409, headers: { "Content-Type": "application/json" } },
			);
		} catch {}
		await fs.mkdir(stackDir, { recursive: true });
		await fs.writeFile(path.join(stackDir, "docker-compose.yml"), compose);
		await fs.writeFile(path.join(stackDir, ".env"), env || "");

		// Auto-deploy logic with logging
		const logPath = path.join(stackDir, "deploy.log");
		const swarm = await isSwarmActive();
		const deployCmd = swarm
			? ["stack", "deploy", "-c", "docker-compose.yml", name]
			: ["compose", "up", "-d"];
		const cmd = "docker";
		try {
			const logStream = await fs.open(logPath, "w");
			const proc = spawn(cmd, deployCmd, { cwd: stackDir });
			proc.stdout.on("data", (data) => logStream.write(data));
			proc.stderr.on("data", (data) => logStream.write(data));
			proc.on("close", async (code) => {
				await logStream.write(`\n[Process exited with code ${code}]\n`);
				await logStream.close();
			});
			// Don't wait for process to finish, return immediately
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} catch (deployError) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Stack created but failed to deploy: " + deployError,
				}),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}
	} catch (error) {
		return new Response(
			JSON.stringify({ success: false, message: "Failed to create stack." }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}; 