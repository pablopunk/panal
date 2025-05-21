import { Loader2, Play, RotateCcw, StopCircle } from "lucide-react";
import { useState } from "react";

interface Props {
	stackId: string;
	stackStatus: "running" | "partial" | "stopped";
	onAction?: (action: "start" | "stop" | "restart") => void;
}

const baseClass =
	"flex gap-1 items-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 px-3 py-1.5 text-sm";
const variants = {
	primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
	danger: "bg-red-600 hover:bg-red-700 text-white",
	secondary:
		"bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100",
};

export default function StackActionButtons({
	stackId,
	stackStatus,
	onAction,
}: Props) {
	const [loading, setLoading] = useState(false);

	const handleAction = async (action: "start" | "stop" | "restart") => {
		setLoading(true);
		await fetch(`/api/stacks/${stackId}/action`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action }),
		});
		setLoading(false);
		if (onAction) onAction(action);
	};

	return (
		<div className="flex gap-2">
			{stackStatus === "running" ? (
				<button
					className={`${baseClass} ${variants.secondary}`}
					type="button"
					disabled={loading}
					onClick={() => handleAction("stop")}
					aria-label="Stop"
				>
					{loading ? (
						<Loader2 className="animate-spin w-4 h-4" />
					) : (
						<StopCircle className="w-4 h-4" />
					)}
				</button>
			) : (
				<button
					className={`${baseClass} ${variants.primary}`}
					type="button"
					disabled={loading}
					onClick={() => handleAction("start")}
					aria-label="Start"
				>
					{loading ? (
						<Loader2 className="animate-spin w-4 h-4" />
					) : (
						<Play className="w-4 h-4" />
					)}
				</button>
			)}
			<button
				className={`${baseClass} ${variants.secondary}`}
				type="button"
				disabled={loading}
				onClick={() => handleAction("restart")}
				aria-label="Restart"
			>
				{loading ? (
					<Loader2 className="animate-spin w-4 h-4" />
				) : (
					<RotateCcw className="w-4 h-4" />
				)}
			</button>
		</div>
	);
} 