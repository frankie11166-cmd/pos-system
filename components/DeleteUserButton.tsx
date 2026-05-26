"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteUserButtonProps = {
  userId: number;
  userName: string;
  disabled?: boolean;
};

export function DeleteUserButton({ userId, userName, disabled }: DeleteUserButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function removeUser() {
    if (!window.confirm(`Delete staff account for ${userName}? They will no longer be able to log in.`)) return;

    setSaving(true);
    setError("");
    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Could not delete user.");
      return;
    }

    router.refresh();
  }

  return (
    <span className="inline-action">
      <button className="btn secondary danger-button" disabled={disabled || saving} onClick={removeUser} type="button">
        {saving ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="inline-error">{error}</span>}
    </span>
  );
}
