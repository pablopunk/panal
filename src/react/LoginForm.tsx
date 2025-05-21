import type React from "react";
import { useState } from "react";
import Button from "./Button";
import Input from "./Input";

export default function LoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
		const data = await res.json();
		setLoading(false);
		if (data.success) {
			window.location.href = "/";
		} else {
			setError(data.message || "Login failed");
		}
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<Input
				label="Username"
				name="username"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				required
			/>
			<Input
				type="password"
				label="Password"
				name="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
			{error && <div className="text-red-600 text-sm">{error}</div>}
			<div className="pt-4">
				<Button
					type="submit"
					className="w-full flex justify-center"
					disabled={loading}
				>
					{loading ? "Logging in..." : "🔑 Login"}
				</Button>
			</div>
		</form>
	);
} 