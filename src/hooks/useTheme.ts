import { useEffect, useState } from "react";
import type { ThemeMode } from "../types";

const THEME_STORAGE_KEY = "clipvault_theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "dark" || stored === "light" || stored === "system") {
        return stored;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return "system";
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignored
    }
  }, [theme, resolvedTheme]);

  const setTheme = (next: ThemeMode) => {
    setThemeState(next);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const currentResolved = prev === "system" ? (systemDark ? "dark" : "light") : prev;
      return currentResolved === "dark" ? "light" : "dark";
    });
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
