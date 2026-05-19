import { useEffect, useState } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    // 1. Revisar si ya hay tema guardado
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";

    // 2. Si no hay nada, usar preferencia del sistema
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="absolute top-5 right-5 px-3 py-1 rounded-lg 
      bg-gray-200 dark:bg-gray-700 text-sm transition"
    >
      {dark ? "🌞" : "🌙"}
    </button>
  );
}

export default ThemeToggle;