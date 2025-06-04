import type React from "react";
import { useState } from "react";
import Button from "./Button";
import Input from "./Input";

export default function SetupForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [swarmAction, setSwarmAction] = useState("skip");
  const [joinToken, setJoinToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, swarmAction, joinToken }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      window.location.href = "/";
    } else {
      setError(data.message || "Setup failed");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Create Admin User</h2>
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
        <Input
          type="password"
          label="Confirm Password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-medium">Docker Swarm</h2>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="init-swarm"
              name="swarm-action"
              value="init"
              className="mr-2"
              checked={swarmAction === "init"}
              onChange={() => setSwarmAction("init")}
            />
            <label htmlFor="init-swarm" className="text-sm font-medium">
              Initialize a new swarm
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="join-swarm"
              name="swarm-action"
              value="join"
              className="mr-2"
              checked={swarmAction === "join"}
              onChange={() => setSwarmAction("join")}
            />
            <label htmlFor="join-swarm" className="text-sm font-medium">
              Join an existing swarm
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="skip-swarm"
              name="swarm-action"
              value="skip"
              className="mr-2"
              checked={swarmAction === "skip"}
              onChange={() => setSwarmAction("skip")}
            />
            <label htmlFor="skip-swarm" className="text-sm font-medium">
              Skip (use standalone Docker)
            </label>
          </div>
        </div>
        {swarmAction === "join" && (
          <Input
            label="Swarm Join Token"
            name="joinToken"
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            placeholder="docker swarm join-token worker"
          />
        )}
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full flex justify-center"
          disabled={loading}
        >
          {loading ? "Setting up..." : "🚀 Complete Setup"}
        </Button>
      </div>
    </form>
  );
}
