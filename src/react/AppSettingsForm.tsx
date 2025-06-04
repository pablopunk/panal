import type React from "react";
import { useEffect, useState } from "react";
import Button from "./Button";
import Input from "./Input";

export default function AppSettingsForm() {
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setHostname(data.data?.hostname || "localhost"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setSuccess("Hostname updated!");
    } else {
      setError(data.message || "Failed to update hostname");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="pt-2">
        <Input
          label="Hostname"
          name="hostname"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          required
        />
      </div>
      {error && <div className="text-red-600 text-sm pt-2">{error}</div>}
      {success && <div className="text-green-600 text-sm pt-2">{success}</div>}
      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Application Settings"}
        </Button>
      </div>
    </form>
  );
}
