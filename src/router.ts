import { useSyncExternalStore } from 'react';

/** Hash router: survives reloads on static hosting with no server rewrites. */
export function go(path: string, replace = false) {
  const h = '#' + path;
  if (replace) history.replaceState(null, '', h);
  else history.pushState(null, '', h);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function current() {
  return location.hash.replace(/^#/, '') || '/';
}

export function useRoute(): string {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb);
      window.addEventListener('popstate', cb);
      return () => {
        window.removeEventListener('hashchange', cb);
        window.removeEventListener('popstate', cb);
      };
    },
    current,
  );
}
