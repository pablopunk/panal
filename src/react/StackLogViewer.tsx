import { useEffect, useRef, useState } from "react";

interface StackLogViewerProps {
	stackId: string;
	className?: string;
}

export default function StackLogViewer({
	stackId,
	className,
}: StackLogViewerProps) {
	const [log, setLog] = useState("");
	const [live, setLive] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		setLog("");
		setLive(true);
		const wsUrl = `ws://${window.location.host.replace(/:\d+$/, ":3001")}/ws/stack-log-feed?id=${stackId}`;
		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;
		ws.onopen = () => console.log("Log feed WebSocket opened");
		ws.onmessage = (event) => {
			setLog((prev) => prev + event.data);
		};
		ws.onclose = (event) => {
			console.log("Log feed WebSocket closed", event);
			setLive(false);
		};
		ws.onerror = (event) => {
			console.error("Log feed WebSocket error", event);
			setLive(false);
		};
		return () => {
			console.log("Log feed WebSocket cleanup/close");
			ws.close();
		};
	}, [stackId]);

	return (
		<div className={className}>
			<div className="flex items-center gap-2 mb-2">
				<span className="font-medium">Deployment Log</span>
				{live && <span className="text-xs text-emerald-500">(live)</span>}
			</div>
			<pre className="bg-gray-900 text-green-200 p-4 rounded overflow-auto max-h-64 font-mono text-xs">
				{log || (live ? "Waiting for log output..." : "No logs yet.")}
			</pre>
		</div>
	);
} 