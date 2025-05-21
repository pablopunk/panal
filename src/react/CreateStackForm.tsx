import { navigate } from "astro:transitions/client";
import Editor from "@monaco-editor/react";
import * as yaml from "js-yaml";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
		'version: "3.8"\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8080:80"',
	);
	const [env, setEnv] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [yamlError, setYamlError] = useState("");
	const [monacoTheme, setMonacoTheme] = useState(getInitialTheme());

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

	function validateYaml(value: string) {
		try {
			const doc = yaml.load(value);
			setYamlError("");
			return doc;
		} catch (e: unknown) {
			setYamlError(e instanceof Error ? e.message : String(e));
			return null;
		}
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);
		const doc = validateYaml(compose);
		if (!doc) {
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
				navigate("/");
			}, 1000);
			return;
		}
		setError(data.message || "Failed to create stack.");
		setIsSubmitting(false);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<label htmlFor="stack-name" className="block text-sm font-medium mb-1">
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
					<label htmlFor="compose-editor" className="text-sm font-medium">
						docker-compose.yml
					</label>
					{yamlError && (
						<span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
							YAML Error
						</span>
					)}
				</div>
				<Editor
					theme={monacoTheme}
					height="200px"
					defaultLanguage="yaml"
					value={compose}
					onChange={(v) => setCompose(v || "")}
					options={{
						minimap: { enabled: false },
						fontSize: 14,
						wordWrap: "on",
					}}
				/>
				{yamlError && (
					<div className="text-red-500 text-xs mt-1">{yamlError}</div>
				)}
			</div>
			<div>
				<div className="flex justify-between items-center mb-2">
					<label htmlFor="env-editor" className="text-sm font-medium">
						.env file
					</label>
				</div>
				<Editor
					theme={monacoTheme}
					height="100px"
					defaultLanguage="ini"
					value={env}
					onChange={(v) => setEnv(v || "")}
					options={{
						minimap: { enabled: false },
						fontSize: 14,
						wordWrap: "on",
					}}
				/>
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
	);
}
