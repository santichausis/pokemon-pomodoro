import { useState, useEffect, useCallback } from 'react';

// Light/dark only. On first visit (no saved preference yet) the OS
// preference is used as the initial value; from then on it's a plain
// choice that only changes when the user explicitly toggles it — it does
// not keep following the OS live.
export function useTheme() {
  const [theme, setTheme] = useState('light');

  // Load saved preference, or fall back to the OS preference once on mount.
  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem('poke-theme-mode');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Reflect the resolved theme on the document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const chooseTheme = useCallback(mode => {
    if (mode !== 'light' && mode !== 'dark') return;
    setTheme(mode);
    if (typeof localStorage !== 'undefined') localStorage.setItem('poke-theme-mode', mode);
  }, []);

  return { theme, themeMode: theme, chooseTheme };
}
