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
  const [autoScroll, setAutoScroll] = useState(true);
  const eventRef = useRef<EventSource | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    setLog("");
    setLive(true);
    const es = new EventSource(`/api/stacks/${stackId}/log?stream=1`);
    eventRef.current = es;
    es.onmessage = (ev) => {
      setLog((prev) => prev + ev.data);
      setLive(true);
    };
    es.onerror = () => {
      setLive(false);
    };
    return () => {
      es.close();
    };
  }, [stackId]);

  // Auto-scroll to bottom when log changes and autoScroll is enabled
  // biome-ignore lint/correctness/useExhaustiveDependencies: preRef is stable; re-run only when log or autoScroll change
  useEffect(() => {
    if (autoScroll && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [log, autoScroll]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium">Deployment Log</span>
        {live && <span className="text-xs text-emerald-500">(live)</span>}
        <button
          type="button"
          className={`ml-auto px-2 py-1 rounded text-xs font-medium border ${autoScroll ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"}`}
          onClick={() => setAutoScroll((v) => !v)}
          aria-pressed={autoScroll}
        >
          {autoScroll ? "↓ Auto Scroll: On" : "– Auto Scroll: Off"}
        </button>
      </div>
      <pre
        ref={preRef}
        className="bg-gray-900 text-green-200 p-4 rounded overflow-auto max-h-64 font-mono text-xs"
        style={{ maxHeight: 256 }}
      >
        {log || (live ? "Waiting for log output..." : "No logs yet.")}
      </pre>
    </div>
  );
}
