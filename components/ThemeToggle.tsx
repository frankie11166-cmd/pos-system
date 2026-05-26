"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"day" | "evening">("day");

  useEffect(() => {
    const saved = window.localStorage.getItem("theme");
    const initial = saved === "evening" ? "evening" : "day";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next = theme === "evening" ? "day" : "evening";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("theme", next);
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Switch color theme">
      <span className="theme-dot" />
      {theme === "evening" ? "Evening" : "Bright"}
    </button>
  );
}
