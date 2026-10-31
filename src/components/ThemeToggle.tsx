"use client";

import { useEffect, useState } from "react";

type ThemeType = "light" | "dark" | "system";
const valid = (value: string | null): ThemeType =>
  value === "light" || value === "dark" ? value : "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeType>("system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("theme"); } catch { /* Storage is optional. */ }
      const preference = valid(saved);
      setTheme(preference);
      const dark = preference === "dark" || (preference === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    const storage = (event: StorageEvent) => {
      if (event.key === "theme" || event.key === null) sync();
    };
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", storage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", storage);
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const preference = valid(event.target.value);
    setTheme(preference);
    try { localStorage.setItem("theme", preference); } catch { /* Storage is optional. */ }
    const dark = preference === "dark" || (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  };

  return (
    <select aria-label="Tema da interface" value={theme} onChange={handleChange} className="theme-select">
      <option value="light">☀️ Claro</option>
      <option value="dark">🌙 Escuro</option>
      <option value="system">🖥️ Sistema</option>
    </select>
  );
}
