import { useCallback, useState } from "react";

const readTheme = () =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

// Theme is applied pre-paint by the inline script in index.html; this keeps it in sync.
export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);

  const setTheme = useCallback((next) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked (private mode): theme still applies for this visit.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(readTheme() === "dark" ? "light" : "dark"),
    [setTheme]
  );

  return { theme, setTheme, toggleTheme };
}
