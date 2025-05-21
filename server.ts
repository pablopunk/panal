import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { type WebSocket, WebSocketServer } from "ws";

const STACKS_LOCATION = process.env.STACKS_LOCATION || "./stacks";
const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001;

// Create a bare HTTP server (not serving any HTTP content)
const server = createServer((_, res) => {
	res.writeHead(404);
	res.end();
});

const wss = new WebSocketServer({ server, path: "/ws/stack-log-feed" });

wss.on("connection", (ws: WebSocket, req) => {
	const url = new URL(req.url || "", `http://${req.headers.host}`);
	const stackId = url.searchParams.get("id");
	console.log(`[WS] Connection opened for stackId: ${stackId}`);
	if (!stackId) {
		ws.send(JSON.stringify({ error: "Missing stack id" }));
		ws.close();
		return;
	}
	const logPath = path.join(STACKS_LOCATION, stackId, "deploy.log");

	let lastSize = 0;
	let poller: NodeJS.Timeout | undefined;
	let closed = false;
	let lastInode: number | undefined;

	// Helper to send new data from the log file
	const sendNewData = () => {
		if (closed) return;
		fs.stat(logPath, (err, stats) => {
			if (err) {
				console.log(`[WS] fs.stat error for ${logPath}:`, err.message);
				// clear the poller
				clearInterval(poller);
				return; // file might not exist yet
			}
			// Detect file replacement by inode change or truncation
			let inode: number | undefined = undefined;
			if (
				typeof stats === "object" &&
				stats !== null &&
				"ino" in stats &&
				typeof (stats as { ino: unknown }).ino === "number"
			) {
				inode = (stats as { ino: number }).ino;
			}
			if (
				lastInode !== undefined &&
				inode !== undefined &&
				inode !== lastInode
			) {
				console.log(`[WS] Log file inode changed for ${logPath}`);
				lastSize = 0;
				lastInode = inode;
				fs.readFile(logPath, "utf-8", (err, data) => {
					if (!err && data) {
						console.log(
							`[WS] Log file replaced, sending new contents (${data.length} bytes)`,
						);
						ws.send(`\n[Log file replaced]\n${data}`);
						lastSize = Buffer.byteLength(data);
					}
				});
				return;
			}
			if (stats.size < lastSize) {
				console.log(`[WS] Log file truncated for ${logPath}`);
				lastSize = 0;
			}
			if (stats.size > lastSize) {
				console.log(
					`[WS] Sending new data from ${logPath}: ${lastSize} to ${stats.size}`,
				);
				const stream = fs.createReadStream(logPath, {
					start: lastSize,
					end: stats.size,
				});
				stream.on("data", (chunk) => {
					console.log(`[WS] Sending chunk of size ${chunk.length}`);
					ws.send(chunk.toString());
				});
				stream.on("end", () => {
					lastSize = stats.size;
					lastInode = inode;
				});
			} else {
				lastInode = inode;
			}
		});
	};

	// Polling watcher
	const startPolling = () => {
		if (poller) clearInterval(poller);
		console.log(`[WS] Starting polling watcher for ${logPath}`);
		poller = setInterval(sendNewData, 500);
	};

	// Send initial contents if file exists
	fs.readFile(logPath, "utf-8", (err, data) => {
		if (!err && data) {
			console.log(
				`[WS] Sending initial log contents (${data.length} bytes) for ${logPath}`,
			);
			ws.send(data);
			lastSize = Buffer.byteLength(data);
		}
		// Get initial inode
		fs.stat(logPath, (err, stats) => {
			let inode: number | undefined = undefined;
			if (
				!err &&
				typeof stats === "object" &&
				stats !== null &&
				"ino" in stats &&
				typeof (stats as { ino: unknown }).ino === "number"
			) {
				inode = (stats as { ino: number }).ino;
			}
			if (inode !== undefined) lastInode = inode;
			startPolling();
		});
	});

	ws.on("close", () => {
		closed = true;
		console.log(`[WS] Connection closed for stackId: ${stackId}`);
		if (poller) clearInterval(poller);
	});
});

server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(
		`Log feed WebSocket server listening on ws://localhost:${PORT}/ws/stack-log-feed`,
	);
}); 