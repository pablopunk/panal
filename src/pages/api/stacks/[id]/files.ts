import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { isSwarmActive } from "../../../../lib/docker/services";

const STACKS_LOCATION = process.env.STACKS_LOCATION || "./stacks";

export const GET: APIRoute = async ({ params }) => {
	const { id } = params;
	if (!id || typeof id !== "string") {
		return new Response(
			JSON.stringify({ success: false, message: "Missing stack id" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const stackDir = path.join(STACKS_LOCATION, id);
	try {
		const composePath = path.join(stackDir, "docker-compose.yml");
		const envPath = path.join(stackDir, ".env");
		const [compose, env] = await Promise.all([
			fs.readFile(composePath, "utf-8"),
			fs.readFile(envPath, "utf-8").catch(() => ""),
		]);
		return new Response(
			JSON.stringify({ success: true, data: { compose, env } }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	} catch (err) {
		return new Response(
			JSON.stringify({ success: false, message: String(err) }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};

export const PUT: APIRoute = async ({ params, request }) => {
	const { id } = params;
	if (!id || typeof id !== "string") {
		return new Response(
			JSON.stringify({ success: false, message: "Missing stack id" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
	const stackDir = path.join(STACKS_LOCATION, id);
	try {
		const { compose, env } = await request.json();
		const composePath = path.join(stackDir, "docker-compose.yml");
		const envPath = path.join(stackDir, ".env");
		await fs.writeFile(composePath, compose);
		await fs.writeFile(envPath, env || "");

		// Redeploy/restart the stack
		const logPath = path.join(stackDir, "deploy.log");
		const swarm = await isSwarmActive();
		const cmd = "docker";
		const args = swarm
			? ["stack", "deploy", "-c", "docker-compose.yml", id]
			: ["compose", "down"].concat(["&&", "docker", "compose", "up", "-d"]); // down then up

		const logStream = await fs.open(logPath, "w");
		let proc: ReturnType<typeof spawn>;
		if (swarm) {
			proc = spawn(cmd, args, { cwd: stackDir });
		} else {
			// For standalone, run down then up as a shell command
			proc = spawn(
				"sh",
				["-c", "docker compose down && docker compose up -d"],
				{ cwd: stackDir },
			);
		}
		if (proc.stdout) {
			proc.stdout.on("data", (data) => logStream.write(data));
		}
		if (proc.stderr) {
			proc.stderr.on("data", (data) => logStream.write(data));
		}
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
