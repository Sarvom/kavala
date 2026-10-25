"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Dark is the default look; a person can switch to light in Me. The choice
 * stays on this phone (localStorage) and a tiny script in the page head
 * applies it before the first paint, so there's no flash.
 */
export type Theme = "dark" | "light";
export const THEME_KEY = "kavala-theme";

/** Runs in <head> before React; keep it tiny and dependency-free. */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => {
    setThemeState(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const setTheme = useCallback((next: Theme) => {
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage can be unavailable; the choice then lasts for this visit.
    }
    setThemeState(next);
  }, []);
  return [theme, setTheme];
}
