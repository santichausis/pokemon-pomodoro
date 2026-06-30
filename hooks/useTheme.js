import { useState, useEffect, useCallback } from 'react';

// Resolves the active theme from a "mode" (auto | light | dark).
// "auto" follows the OS color scheme live.
export function useTheme() {
  const [themeMode, setThemeMode] = useState('auto');
  const [systemTheme, setSystemTheme] = useState('light');
  const theme = themeMode === 'auto' ? systemTheme : themeMode;

  // Load saved preference
  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem('poke-theme-mode');
    if (saved === 'auto' || saved === 'light' || saved === 'dark') setThemeMode(saved);
  }, []);

  // Track the OS color scheme in real time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Reflect the resolved theme on the document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const chooseTheme = useCallback(mode => {
    setThemeMode(mode);
    if (typeof localStorage !== 'undefined') localStorage.setItem('poke-theme-mode', mode);
  }, []);

  return { theme, themeMode, chooseTheme };
}
