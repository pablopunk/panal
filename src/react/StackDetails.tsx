import { useCallback, useEffect, useRef, useState } from "react";
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

export default function StackDetails({ stackId }: { stackId: string }) {
	const [stack, setStack] = useState<Stack | null>(null);
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);
	const stackRef = useRef<Stack | null>(null);
	const servicesRef = useRef<Service[]>([]);

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

	if (loading || !stack) return <div>Loading...</div>;

	return (
		<div>
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
				<StackActionButtons
					stackId={stackId}
					stackStatus={stack.status}
					onAction={handleAction}
				/>
			)}
			<StackLogViewer stackId={stackId} />
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
		</div>
	);
} 