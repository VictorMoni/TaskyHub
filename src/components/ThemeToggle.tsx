"use client";

import { useEffect, useState } from "react";

type ThemeType = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeType>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeType | null;
    const initial: ThemeType = saved || "system";
    setTheme(initial);

    const getSystem = () =>
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const actual = initial === "system" ? getSystem() : initial;
    document.documentElement.classList.toggle("dark", actual === "dark");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    mq.addEventListener("change", handler);

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark" || (theme === "system" && mq.matches),
    );

    return () => {
      mq.removeEventListener("change", handler);
    };
  }, [theme]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as ThemeType;
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  };

  return (
    <select
      aria-label="Tema da interface"
      value={theme}
      onChange={handleChange}
      className="theme-select"
    >
      <option value="light">☀️ Claro</option>
      <option value="dark">🌙 Escuro</option>
      <option value="system">🖥️ Sistema</option>
    </select>
  );
}
