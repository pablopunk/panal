import { navigate } from "astro:transitions/client";
import Editor, { OnMount } from "@monaco-editor/react";
// @ts-expect-error: composerize has no types
import * as composerize from "composerize";
const convertDockerRunToCompose = composerize.default;
import * as yaml from "js-yaml";
import type * as monacoEditor from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

function getInitialTheme() {
	if (typeof window !== "undefined") {
		return document.documentElement.classList.contains("dark")
			? "vs-dark"
			: "light";
	}
	return "light";
}

export default function CreateStackForm() {
	const [name, setName] = useState("");
	const [compose, setCompose] = useState(
		'services:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8080:80"',
	);
	const [env, setEnv] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [yamlError, setYamlError] = useState("");
	const [monacoTheme, setMonacoTheme] = useState(getInitialTheme());
	const [composeHeight, setComposeHeight] = useState(300);
	const [envHeight, setEnvHeight] = useState(100);
	const composeRef = useRef<HTMLDivElement>(null);
	const envRef = useRef<HTMLDivElement>(null);
	const composeEditorRef =
		useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof monacoEditor | null>(null);

	useEffect(() => {
		// Set initial theme
		setMonacoTheme(
			document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
		);
		// Listen for theme changes
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

	function validateYaml(value: string): boolean {
		try {
			yaml.load(value);
			setYamlError("");
			if (monacoRef.current && composeEditorRef.current) {
				const model = composeEditorRef.current.getModel();
				if (model) {
					monacoRef.current.editor.setModelMarkers(model, "owner", []);
				}
			}
			return true;
		} catch (e: unknown) {
			let message = "Unknown YAML error";
			let mark: { line?: number; column?: number } = {};
			if (e && typeof e === "object" && "message" in e) {
				message = String((e as { message: string }).message);
				if (
					"mark" in e &&
					typeof (e as { mark?: unknown }).mark === "object" &&
					(e as { mark?: unknown }).mark !== null
				) {
					mark = (e as { mark: { line?: number; column?: number } }).mark;
				}
			}
			setYamlError(message);
			if (monacoRef.current && composeEditorRef.current) {
				const model = composeEditorRef.current.getModel();
				if (model) {
					monacoRef.current.editor.setModelMarkers(model, "owner", [
						{
							startLineNumber: (mark.line ?? 0) + 1,
							startColumn: (mark.column ?? 0) + 1,
							endLineNumber: (mark.line ?? 0) + 1,
							endColumn: (mark.column ?? 0) + 2,
							message,
							severity: monacoRef.current.MarkerSeverity.Error,
						},
					]);
				}
			}
			return false;
		}
	}

	function handleResize(
		setHeight: (h: number) => void,
		min: number,
		max: number,
	) {
		return (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
			e.preventDefault();
			const startY = e.clientY;
			const startHeight = e.currentTarget.parentElement?.offsetHeight || min;
			function onMouseMove(ev: MouseEvent) {
				const newHeight = Math.min(
					Math.max(startHeight + (ev.clientY - startY), min),
					max,
				);
				setHeight(newHeight);
			}
			function onMouseUp() {
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
			}
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		};
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);
		const isValid = validateYaml(compose);
		if (!isValid) {
			setError("Compose YAML is invalid.");
			setIsSubmitting(false);
			return;
		}
		// Parse YAML again for further checks
		let doc: unknown;
		try {
			doc = yaml.load(compose);
		} catch {
			setError("Compose YAML is invalid.");
			setIsSubmitting(false);
			return;
		}
		// Check for deploy prop
		if (
			typeof doc === "object" &&
			doc !== null &&
			"services" in doc &&
			typeof (doc as { services?: unknown }).services === "object" &&
			(doc as { services?: unknown }).services !== null
		) {
			const services = Object.values(
				(doc as { services: Record<string, unknown> }).services,
			);
			for (const svc of services) {
				if (svc && typeof svc === "object" && "deploy" in svc) {
					// Check if Swarm is enabled
					const res = await fetch("/api/docker/swarm");
					const { swarm } = await res.json();
					if (!swarm) {
						setError('The "deploy" property requires Docker Swarm mode.');
						setIsSubmitting(false);
						return;
					}
				}
			}
		}
		// POST to API
		const res = await fetch("/api/stacks/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, compose, env }),
		});
		const data = await res.json();
		if (data.success) {
			toast.success("Stack created successfully!");
			setTimeout(() => {
				navigate(`/stacks/${name}`);
			}, 1000);
			return;
		}
		setError(data.message || "Failed to create stack.");
		setIsSubmitting(false);
	}

	return (
		<>
			<form onSubmit={handleSubmit} className="space-y-6 w-full mx-auto">
				<div>
					<label
						htmlFor="stack-name"
						className="block text-sm font-medium mb-1"
					>
						Stack Name
					</label>
					<input
						id="stack-name"
						name="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					/>
				</div>
				<div>
					<div className="flex justify-between items-center mb-2">
						<label
							htmlFor="compose-editor"
							className="text-sm font-medium font-mono"
						>
							docker-compose.yml
						</label>
						{yamlError && (
							<span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
								YAML Error
							</span>
						)}
						<span className="text-xs text-gray-500">
							or try pasting a{" "}
							<code className="font-mono text-gray-600 dark:text-gray-400">
								docker run
							</code>{" "}
							command
						</span>
					</div>
					<div
						ref={composeRef}
						style={{ height: composeHeight, minHeight: 150, maxHeight: 1000 }}
						className="relative group border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
					>
						<Editor
							theme={monacoTheme}
							height="100%"
							defaultLanguage="yaml"
							value={compose}
							onChange={(v) => {
								const value = v || "";
								if (value.trim().startsWith("docker run")) {
									let yamlStr = convertDockerRunToCompose(value.trim());
									const lines = yamlStr.split("\n");
									if (lines[0].trim().startsWith("name:")) {
										yamlStr = lines.slice(1).join("\n");
									}
									if (composeEditorRef.current) {
										composeEditorRef.current.setValue(yamlStr);
									}
									setCompose(yamlStr);
									validateYaml(yamlStr);
									toast.success(
										"Converted docker run command to Compose YAML!",
									);
									return;
								}
								setCompose(value);
								validateYaml(value);
							}}
							onMount={(editor, monaco) => {
								composeEditorRef.current = editor;
								monacoRef.current = monaco;
								validateYaml(compose);
							}}
							options={{
								minimap: { enabled: false },
								fontSize: 14,
								wordWrap: "on",
							}}
						/>
						<div
							className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize bg-gray-100 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
							onMouseDown={handleResize(setComposeHeight, 150, 1000)}
							style={{ zIndex: 10 }}
							aria-label="Resize compose editor"
							role="separator"
							tabIndex={0}
						/>
					</div>
				</div>
				<div>
					<div className="flex justify-between items-center mb-2">
						<label
							htmlFor="env-editor"
							className="text-sm font-medium font-mono"
						>
							.env file
						</label>
					</div>
					<div
						ref={envRef}
						style={{ height: envHeight, minHeight: 50, maxHeight: 500 }}
						className="relative group border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
					>
						<Editor
							theme={monacoTheme}
							height="100%"
							defaultLanguage="ini"
							value={env}
							onChange={(v) => setEnv(v || "")}
							options={{
								minimap: { enabled: false },
								fontSize: 14,
								wordWrap: "on",
							}}
						/>
						<div
							className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize bg-gray-100 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
							onMouseDown={handleResize(setEnvHeight, 50, 500)}
							style={{ zIndex: 10 }}
							aria-label="Resize env editor"
							role="separator"
							tabIndex={0}
						/>
					</div>
				</div>
				{error && <div className="text-red-500 text-sm">{error}</div>}
				<button
					type="submit"
					disabled={isSubmitting || !!yamlError || !name.trim()}
					className="w-full flex justify-center items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition-colors disabled:opacity-60"
				>
					{isSubmitting ? "Creating..." : "Create Stack"}
				</button>
			</form>
		</>
	);
}
