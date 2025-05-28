import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import type { APIRoute } from "astro";
import { logger } from "../../lib/logger";

// Common Docker daemon log locations
const LOG_PATHS = [
	"/var/log/docker.log",
	"/var/log/upstart/docker.log",
	"/var/log/syslog", // sometimes logs are here
];

async function getDockerLogs({ lines = 200 }: { lines?: number }) {
	// Try journalctl first (systemd systems)
	return new Promise<string>((resolve) => {
		const journal = spawn("journalctl", [
			"-u",
			"docker.service",
			"-n",
			String(lines),
			"--no-pager",
		]);

		let output = "";
		let errored = false;
		journal.stdout.on("data", (data) => {
			output += data.toString();
		});
		journal.stderr.on("data", () => {
			errored = true;
		});
		journal.on("close", (code) => {
			if (!errored && output.trim()) {
				resolve(output);
			} else {
				// Fallback to log files
				(async () => {
					for (const logPath of LOG_PATHS) {
						if (existsSync(logPath)) {
							try {
								const file = await fs.readFile(logPath, "utf-8");
								const linesArr = file.trim().split("\n");
								resolve(linesArr.slice(-lines).join("\n"));
								return;
							} catch {}
						}
					}
					resolve("");
				})();
			}
		});
	});
}

export const GET: APIRoute = async ({ request }) => {
	logger.info("GET /api/docker-logs called");
	const url = new URL(request.url);
	const lines = Number(url.searchParams.get("lines")) || 200;
	try {
		const logs = await getDockerLogs({ lines });
		return new Response(logs, {
			status: 200,
			headers: { "Content-Type": "text/plain" },
		});
	} catch (err) {
		logger.error("Failed to get docker logs", err);
		return new Response("Failed to get logs", { status: 500 });
	}
};
