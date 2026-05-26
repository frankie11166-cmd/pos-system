"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormProps = {
  setupMode: boolean;
};

type Status = { type: "success" | "error"; text: string } | null;

export function LoginForm({ setupMode }: LoginFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    setStatus(null);

    const response = await fetch(setupMode ? "/api/auth/setup" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        pin: formData.get("pin"),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "Could not log in." });
      return;
    }

    setStatus({ type: "success", text: setupMode ? "Owner account created." : "Logged in." });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form action={submit} className="auth-card">
      <div>
        <p className="auth-eyebrow">Shoe Store POS</p>
        <h1 className="auth-title">{setupMode ? "Create owner PIN" : "Log in"}</h1>
        <p className="subtitle">
          {setupMode
            ? "Create the first owner account. After this, the owner can add staff accounts."
            : "Enter your 4-digit PIN to continue."}
        </p>
      </div>
      <div className="grid">
        {setupMode && (
          <div className="field">
            <label>Owner Name</label>
            <input name="name" required placeholder="Owner" />
          </div>
        )}
        <div className="field">
          <label>4-Digit PIN</label>
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={4}
            name="pin"
            pattern="[0-9]{4}"
            placeholder="1234"
            required
            type="password"
          />
        </div>
      </div>
      <button className="btn" disabled={saving} type="submit">
        {saving ? "Please wait..." : setupMode ? "Create Owner" : "Log In"}
      </button>
      {status && <div className={`message ${status.type}`}>{status.text}</div>}
    </form>
  );
}
