import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { deferredReload } from './lib/updates';
import { getState } from './lib/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const updater = deferredReload({ route: () => location.hash, onboarded: () => getState().onboarded, reload: () => location.reload() });
  window.addEventListener('hashchange', updater.check);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && updater.check());
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true, onNeedReload: updater.request }));
}
