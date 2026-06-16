'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'i2p-theme';

// The theme lives in an external store — the <html> class — so we read it with
// useSyncExternalStore and observe changes instead of mirroring it into state.
function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

export function useTheme(): { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
    // The MutationObserver above re-renders subscribers with the new snapshot.
  }, []);

  const toggle = useCallback(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, toggle, setTheme };
}
