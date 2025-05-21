import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import StackActionButtons from "./StackActionButtons";
import StackLogViewer from "./StackLogViewer";

interface Stack {
	id: string;
	name: string;
	status: "running" | "partial" | "stopped";
	type: "swarm" | "standalone";
	managedBy: "panal" | "external";
}

interface Service {
	id: string;
	name: string;
	status: "running" | "stopped";
	replicas: number;
	image: string;
	ports: { published: number; target: number; protocol: string }[];
}

const POLL_INTERVAL = 5000;

function deepEqual<T>(a: T, b: T): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

function getInitialTheme() {
	if (typeof window !== "undefined") {
		return document.documentElement.classList.contains("dark")
			? "vs-dark"
			: "light";
	}
	return "light";
}

export default function StackDetails({ stackId }: { stackId: string }) {
	const [stack, setStack] = useState<Stack | null>(null);
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);
	const stackRef = useRef<Stack | null>(null);
	const servicesRef = useRef<Service[]>([]);

	// For editing
	const [compose, setCompose] = useState("");
	const [env, setEnv] = useState("");
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState("");
	const [monacoTheme, setMonacoTheme] = useState(getInitialTheme());
	const [editFetched, setEditFetched] = useState(false);

	useEffect(() => {
		setMonacoTheme(
			document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
		);
		const observer = new MutationObserver(() => {
			setMonacoTheme(
				document.documentElement.classList.contains("dark")
					? "vs-dark"
					: "light",
			);
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		stackRef.current = stack;
	}, [stack]);
	useEffect(() => {
		servicesRef.current = services;
	}, [services]);

	const fetchStack = useCallback(async () => {
		setLoading(true);
		const res = await fetch(`/api/stacks/${stackId}`);
		const data = await res.json();
		setStack(data.data);
		setLoading(false);
	}, [stackId]);

	const fetchServices = useCallback(async () => {
		const res = await fetch(`/api/services?stackId=${stackId}`);
		const data = await res.json();
		setServices(data.data || []);
	}, [stackId]);

	// Fetch compose/env for editing
	const fetchFiles = useCallback(async () => {
		try {
			const res = await fetch(`/api/stacks/${stackId}/files`);
			const data = await res.json();
			if (data.success) {
				setCompose(data.data.compose);
				setEnv(data.data.env);
				setEditFetched(true);
			}
		} catch (err) {
			setEditError("Failed to load stack files.");
		}
	}, [stackId]);

	useEffect(() => {
		fetchStack();
		fetchServices();
		const interval = setInterval(async () => {
			// Fetch stack
			const resStack = await fetch(`/api/stacks/${stackId}`);
			const dataStack = await resStack.json();
			if (!deepEqual(dataStack.data, stackRef.current)) {
				setStack(dataStack.data);
			}
			// Fetch services
			const resServices = await fetch(`/api/services?stackId=${stackId}`);
			const dataServices = await resServices.json();
			if (!deepEqual(dataServices.data, servicesRef.current)) {
				setServices(dataServices.data || []);
			}
		}, POLL_INTERVAL);
		return () => clearInterval(interval);
	}, [stackId, fetchStack, fetchServices]);

	useEffect(() => {
		if (stack && stack.managedBy === "panal" && !editFetched) {
			fetchFiles();
		}
	}, [stack, editFetched, fetchFiles]);

	const handleAction = async (action: "start" | "stop" | "restart") => {
		await fetch(`/api/stacks/${stackId}/action`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action }),
		});
		// Re-fetch stack status and services after action
		fetchStack();
		fetchServices();
	};

	const handleSave = async () => {
		setEditLoading(true);
		setEditError("");
		try {
			const res = await fetch(`/api/stacks/${stackId}/files`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ compose, env }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Stack updated and redeployed!");
				fetchStack();
				fetchServices();
			} else {
				setEditError(data.message || "Failed to update stack.");
				toast.error(data.message || "Failed to update stack.");
			}
		} catch (err) {
			setEditError("Failed to update stack.");
			toast.error("Failed to update stack.");
		} finally {
			setEditLoading(false);
		}
	};

	if (loading || !stack) return <div>Loading...</div>;

	return (
		<div>
			<Toaster position="top-center" richColors />
			<div className="flex items-center gap-2 mb-2">
				<h1 className="text-2xl font-bold">{stack.name}</h1>
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${
						stack.status === "running"
							? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
							: stack.status === "partial"
								? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
								: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
					}`}
				>
					{stack.status}
				</span>
				<span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium">
					{stack.type}
				</span>
				{stack.managedBy === "panal" && (
					<span className="px-2 py-1 rounded bg-orange-500/40 text-xs font-medium">
						Panal
					</span>
				)}
			</div>
			{stack.managedBy === "panal" && (
				<>
					<StackActionButtons
						stackId={stackId}
						stackStatus={stack.status}
						onAction={handleAction}
					/>
					<StackLogViewer stackId={stackId} className="mk-6" />
				</>
			)}
			{/* Render services, etc. */}
			<div className="mt-6">
				<h2 className="text-lg font-semibold mb-2">Services</h2>
				{services.length === 0 && (
					<div className="text-gray-500">No services found.</div>
				)}
				<div className="space-y-4">
					{services.map((service) => (
						<div
							key={service.id}
							className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-4 hover:border-emerald-500 transition-colors"
						>
							<div className="flex justify-between items-start">
								<div>
									<h3 className="text-lg font-medium mb-2">{service.name}</h3>
									<div className="flex items-center gap-2 mb-4">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												service.status === "running"
													? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
													: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
											}`}
										>
											{service.status}
										</span>
										<span className="text-sm text-gray-500 dark:text-gray-400 flex">
											{service.replicas !== 1
												? `${service.replicas} replicas`
												: "1 replica"}
										</span>
									</div>
								</div>
							</div>
							{service.ports.length > 0 && (
								<div className="mt-4">
									<div className="text-sm font-medium mb-2">Ports</div>
									<div className="flex flex-wrap gap-2">
										{service.ports.map((port) => (
											<a
												key={`${port.published}:${port.target}`}
												href={`http://localhost:${port.published}`}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm"
											>
												{port.published}:{port.target}
											</a>
										))}
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Edit section for Panal-managed stacks */}
			{stack.managedBy === "panal" && (
				<div className="mt-10">
					<div className="mb-6">
						<label
							id="compose-label"
							className="block text-sm font-medium mb-1"
						>
							docker-compose.yml
						</label>
						<Editor
							height="200px"
							defaultLanguage="yaml"
							value={compose}
							onChange={(v) => setCompose(v || "")}
							options={{
								minimap: { enabled: false },
								fontSize: 14,
								wordWrap: "on",
							}}
							theme={monacoTheme}
							aria-labelledby="compose-label"
							className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
						/>
					</div>
					<div className="mb-6">
						<label id="env-label" className="block text-sm font-medium mb-1">
							.env file
						</label>
						<Editor
							height="100px"
							defaultLanguage="ini"
							value={env}
							onChange={(v) => setEnv(v || "")}
							options={{
								minimap: { enabled: false },
								fontSize: 14,
								wordWrap: "on",
							}}
							theme={monacoTheme}
							aria-labelledby="env-label"
							className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
						/>
					</div>
					{editError && (
						<div className="text-red-500 text-sm mb-2">{editError}</div>
					)}
					<button
						type="button"
						disabled={editLoading}
						onClick={handleSave}
						className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition-colors disabled:opacity-60"
					>
						{editLoading ? "Saving..." : "Save & Redeploy"}
					</button>
				</div>
			)}
		</div>
	);
} 