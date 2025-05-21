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
	if (!stackId) {
		ws.send(JSON.stringify({ error: "Missing stack id" }));
		ws.close();
		return;
	}
	const logPath = path.join(STACKS_LOCATION, stackId, "deploy.log");

	let lastSize = 0;
	let watcher: fs.FSWatcher | undefined;
	let closed = false;

	// Helper to send new data from the log file
	const sendNewData = () => {
		if (closed) return;
		fs.stat(logPath, (err, stats) => {
			if (err) return; // file might not exist yet
			if (stats.size < lastSize) {
				// File was truncated, send from start
				lastSize = 0;
			}
			if (stats.size > lastSize) {
				const stream = fs.createReadStream(logPath, {
					start: lastSize,
					end: stats.size,
				});
				stream.on("data", (chunk) => {
					ws.send(chunk.toString());
				});
				stream.on("end", () => {
					lastSize = stats.size;
				});
			}
		});
	};

	// Send initial contents if file exists
	fs.readFile(logPath, "utf-8", (err, data) => {
		if (!err && data) {
			ws.send(data);
			lastSize = Buffer.byteLength(data);
		}
		// Start watching for changes
		watcher = fs.watch(logPath, (eventType) => {
			if (eventType === "change") {
				sendNewData();
			}
		});
	});

	ws.on("close", () => {
		closed = true;
		if (watcher) watcher.close();
	});
});

server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(
		`Log feed WebSocket server listening on ws://localhost:${PORT}/ws/stack-log-feed`,
	);
}); 