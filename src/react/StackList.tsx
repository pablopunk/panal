import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";
import StackActionButtons from "./StackActionButtons";

interface Stack {
	id: string;
	name: string;
	status: "running" | "partial" | "stopped";
	type: "swarm" | "standalone";
	managedBy: "panal" | "external";
	services: number;
}

function deepEqual<T>(a: T, b: T): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

const POLL_INTERVAL = 2000;

export default function StackList() {
	const [stacks, setStacks] = useState<Stack[] | null>(null);
	const stacksRef = useRef<Stack[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [removingStack, setRemovingStack] = useState<Stack | null>(null);
	const [removing, setRemoving] = useState(false);

	useEffect(() => {
		stacksRef.current = stacks;
	}, [stacks]);

	useEffect(() => {
		const fetchStacks = async () => {
			setLoading(true);
			const res = await fetch("/api/stacks");
			const data = await res.json();
			setStacks(data.data);
			setLoading(false);
		};
		fetchStacks();
		const interval = setInterval(async () => {
			const res = await fetch("/api/stacks");
			const data = await res.json();
			if (!deepEqual(data.data, stacksRef.current)) {
				setStacks(data.data);
			}
		}, POLL_INTERVAL);
		return () => clearInterval(interval);
	}, []);

	if (loading || !stacks) {
		return (
			<div className="flex justify-center items-center py-12">
				<Loader2 className="animate-spin w-6 h-6 text-gray-400" />
			</div>
		);
	}

	const panalStacks = stacks.filter((stack) => stack.managedBy === "panal");
	const externalStacks = stacks.filter(
		(stack) => stack.managedBy === "external",
	);

	// Helper to prevent row click when clicking a button
	const stopPropagation = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	const handleRowClick = (stackId: string) => {
		window.location.href = `/stacks/${stackId}`;
	};

	const handleRowKeyDown = (e: React.KeyboardEvent, stackId: string) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleRowClick(stackId);
		}
	};

	// Remove stack: stop it, then remove from directory
	const handleRemove = async () => {
		if (!removingStack) return;
		setRemoving(true);
		try {
			// Stop the stack first
			await fetch(`/api/stacks/${removingStack.id}/action`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "stop" }),
			});
			// Remove the stack
			const res = await fetch(`/api/stacks/${removingStack.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to remove stack");
			toast.success(`Stack '${removingStack.name}' removed successfully`);
			setRemovingStack(null);
			// Refresh list
			const stacksRes = await fetch("/api/stacks");
			const data = await stacksRes.json();
			setStacks(data.data);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || "Failed to remove stack");
		} finally {
			setRemoving(false);
		}
	};

	// Use a button for the row for accessibility
	const RowButton = ({
		children,
		onClick,
		onKeyDown,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<article
			className="w-full text-left p-0 bg-transparent border-none active:outline-none hover:ring-2 hover:ring-emerald-500 rounded-lg"
			onClick={onClick}
			onKeyDown={onKeyDown}
			{...props}
		>
			{children}
		</article>
	);

	return (
		<>
			<div className="space-y-8">
				{panalStacks.length > 0 && (
					<div>
						<h2 className="text-lg font-semibold mb-2">Stacks</h2>
						<div className="space-y-2">
							{panalStacks.map((stack) => (
								<RowButton
									key={stack.id}
									onClick={() => handleRowClick(stack.id)}
									onKeyDown={(e) => handleRowKeyDown(e, stack.id)}
									aria-label={`View stack ${stack.name}`}
								>
									<Card className="p-0 cursor-pointer hover:border-emerald-500 transition-colors">
										<div className="flex items-center justify-between px-4 py-3">
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-base">
														{stack.name}
													</span>
													<Badge
														variant={
															stack.status === "running"
																? "success"
																: stack.status === "partial"
																	? "warning"
																	: "danger"
														}
													>
														{stack.status}
													</Badge>
													<Badge
														variant={
															stack.type === "swarm" ? "info" : "default"
														}
													>
														{stack.type.charAt(0).toUpperCase() +
															stack.type.slice(1)}
													</Badge>
													<Badge variant="warning">Panal</Badge>
												</div>
												<span className="text-xs text-gray-500 dark:text-gray-400">
													{stack.services} service
													{stack.services !== 1 ? "s" : ""}
												</span>
											</div>
											{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
											<div
												className="flex items-center gap-2"
												onClick={stopPropagation}
											>
												<StackActionButtons
													stackId={stack.id}
													stackStatus={stack.status}
												/>
												<Dialog.Root
													open={removingStack?.id === stack.id}
													onOpenChange={(open) =>
														open
															? setRemovingStack(stack)
															: setRemovingStack(null)
													}
												>
													<Dialog.Trigger asChild>
														<Button
															variant="danger"
															size="sm"
															aria-label="Remove"
															onClick={(e) => {
																stopPropagation(e);
																setRemovingStack(stack);
															}}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</Dialog.Trigger>
													<Dialog.Portal>
														<Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
														<Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200 dark:border-gray-800">
															<Dialog.Title className="text-lg font-semibold mb-2">
																Remove Stack
															</Dialog.Title>
															<Dialog.Description className="mb-4 text-gray-600 dark:text-gray-300">
																Are you sure you want to remove{" "}
																<span className="font-semibold">
																	{stack.name}
																</span>
																? This will stop the stack and delete its files.
																This action cannot be undone.
															</Dialog.Description>
															<div className="flex justify-end gap-2 mt-6">
																<Dialog.Close asChild>
																	<Button
																		variant="secondary"
																		disabled={removing}
																	>
																		Cancel
																	</Button>
																</Dialog.Close>
																<Button
																	variant="danger"
																	disabled={removing}
																	onClick={handleRemove}
																>
																	{removing ? (
																		<Loader2 className="animate-spin w-4 h-4 mr-2" />
																	) : (
																		<Trash2 className="w-4 h-4 mr-2" />
																	)}
																	Remove
																</Button>
															</div>
														</Dialog.Content>
													</Dialog.Portal>
												</Dialog.Root>
											</div>
										</div>
									</Card>
								</RowButton>
							))}
						</div>
					</div>
				)}
				{externalStacks.length > 0 && (
					<div>
						<h2 className="text-lg font-semibold mb-2">External Stacks</h2>
						<div className="space-y-2">
							{externalStacks.map((stack) => (
								<RowButton
									key={stack.id}
									onClick={() => handleRowClick(stack.id)}
									onKeyDown={(e) => handleRowKeyDown(e, stack.id)}
									aria-label={`View stack ${stack.name}`}
								>
									<Card className="p-0 cursor-pointer hover:border-emerald-500 transition-colors">
										<div className="flex items-center justify-between px-4 py-3">
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-base">
														{stack.name}
													</span>
													<Badge
														variant={
															stack.status === "running"
																? "success"
																: stack.status === "partial"
																	? "warning"
																	: "danger"
														}
													>
														{stack.status}
													</Badge>
													<Badge
														variant={
															stack.type === "swarm" ? "info" : "default"
														}
													>
														{stack.type.charAt(0).toUpperCase() +
															stack.type.slice(1)}
													</Badge>
													<Badge variant="secondary">External</Badge>
												</div>
												<span className="text-xs text-gray-500 dark:text-gray-400">
													{stack.services} service
													{stack.services !== 1 ? "s" : ""}
												</span>
											</div>
											{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
											<div
												className="flex items-center gap-2"
												onClick={stopPropagation}
											>
												{/* Only show stop/restart if allowed for external stacks, otherwise nothing */}
												{stack.status === "running" && (
													<Button
														variant="danger"
														size="sm"
														aria-label="Stop"
														onClick={(e) => {
															stopPropagation(e); /* TODO: implement stop */
														}}
													>
														Stop
													</Button>
												)}
											</div>
										</div>
									</Card>
								</RowButton>
							))}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
