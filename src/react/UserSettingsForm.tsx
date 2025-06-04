import type React from "react";
import { useState } from "react";
import Button from "./Button";
import Input from "./Input";

export default function UserSettingsForm({
  initialUsername,
}: { initialUsername: string }) {
  const [username, setUsername] = useState(initialUsername);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setSuccess("User settings updated");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(data.message || "Failed to update user settings");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="pt-2">
        <Input
          label="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="pt-2">
        <Input
          type="password"
          label="New Password"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="pt-2">
        <Input
          type="password"
          label="Confirm New Password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      {error && <div className="text-red-600 text-sm pt-2">{error}</div>}
      {success && <div className="text-green-600 text-sm pt-2">{success}</div>}
      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save User Settings"}
        </Button>
      </div>
    </form>
  );
}
