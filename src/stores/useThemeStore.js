import { create } from 'zustand';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolvedTheme) {
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function resolveTheme(theme) {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

const useThemeStore = create((set, get) => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
  const initial = saved || 'system';
  const resolved = resolveTheme(initial);

  if (typeof window !== 'undefined') {
    applyTheme(resolved);
  }

  return {
    theme: initial,
    resolvedTheme: resolved,

    setTheme: (theme) => {
      const resolved = resolveTheme(theme);
      localStorage.setItem('theme', theme);
      applyTheme(resolved);
      set({ theme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
      const { theme } = get();
      const cycle = { light: 'dark', dark: 'system', system: 'light' };
      get().setTheme(cycle[theme]);
    },

    initSystemListener: () => {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const { theme } = get();
        if (theme === 'system') {
          const resolved = getSystemTheme();
          applyTheme(resolved);
          set({ resolvedTheme: resolved });
        }
      };
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    },
  };
});

export default useThemeStore;
