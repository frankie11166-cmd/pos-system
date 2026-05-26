"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = { type: "success" | "error"; text: string } | null;

export function UserForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    setStatus(null);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        pin: formData.get("pin"),
        role: formData.get("role"),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data.error || "Could not create user." });
      return;
    }

    setStatus({ type: "success", text: `${data.name} was created as ${data.role.toLowerCase()}.` });
    router.refresh();
  }

  return (
    <form action={submit} className="panel">
      <h2 style={{ marginTop: 0 }}>Add User</h2>
      <div className="form-grid">
        <div className="field">
          <label>Name</label>
          <input name="name" placeholder="Staff name" required />
        </div>
        <div className="field">
          <label>4-Digit PIN</label>
          <input inputMode="numeric" maxLength={4} name="pin" pattern="[0-9]{4}" placeholder="1234" required type="password" />
        </div>
        <div className="field">
          <label>Role</label>
          <select name="role" defaultValue="STAFF">
            <option value="STAFF">Staff</option>
            <option value="OWNER">Owner</option>
          </select>
        </div>
      </div>
      <div className="button-row">
        <button className="btn" disabled={saving} type="submit">
          {saving ? "Creating..." : "Create User"}
        </button>
      </div>
      {status && <div className={`message ${status.type}`}>{status.text}</div>}
    </form>
  );
}
