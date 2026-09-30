import { useEffect, useState } from 'react';

/** Simple hash-based router. Returns the current path (without leading #). */
export function useHashRoute(): string {
  const [path, setPath] = useState(() => normalize(window.location.hash));

  useEffect(() => {
    const onChange = () => setPath(normalize(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}

function normalize(hash: string): string {
  if (!hash || hash === '#') return '/';
  return hash.replace(/^#/, '');
}

export function navigate(path: string): void {
  window.location.hash = path;
}
