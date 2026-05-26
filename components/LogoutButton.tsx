"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function logout() {
    setSaving(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="logout-button" disabled={saving} onClick={logout} type="button">
      {saving ? "Leaving..." : "Log Out"}
    </button>
  );
}
