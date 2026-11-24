import { useEffect } from 'react';
import { reconcileToday, useApp } from './lib/store';
import { go, useRoute } from './router';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Play } from './screens/Play';
import { ProfileTab, ProgressTab, ReviewTab } from './screens/Tabs';
import { Icon } from './ui/Icon';
import { StorageBanner } from './ui/StorageBanner';
import { pickSession } from './logic/leitner';
import { today } from './lib/store';

const TABS = [
  { path: '/', label: 'Learn', icon: 'Path' },
  { path: '/review', label: 'Review', icon: 'Repeat' },
  { path: '/progress', label: 'Progress', icon: 'ChartBar' },
  { path: '/profile', label: 'Profile', icon: 'User' },
];

function useTheme() {
  const theme = useApp((s) => s.settings.theme);
  const motion = useApp((s) => s.settings.motion);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const t = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = t;
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'dark' ? '#0B1120' : '#F8FAFC'));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      document.documentElement.dataset.motion = motion === 'reduced' || mq.matches ? 'reduced' : 'full';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [motion]);
}

export function App() {
  useTheme();
  const route = useRoute();
  const onboarded = useApp((s) => s.onboarded);
  const due = useApp((s) => pickSession(s.cards, today(), s.days[today()]?.reviews ?? 0).length);

  useEffect(() => {
    reconcileToday();
    const onVis = () => document.visibilityState === 'visible' && reconcileToday();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!onboarded) document.title = 'Welcome · Tally';
  if (!onboarded)
    return (
      <>
        <StorageBanner />
        <Onboarding />
      </>
    );
  if (route.startsWith('/play/'))
    return (
      <>
        <StorageBanner />
        <Play key={route} path={route} />
      </>
    );

  const tab = TABS.find((t) => t.path === route) ?? TABS[0];
  document.title = `${tab.label} · Tally`;
  return (
    <div className="shell">
      <StorageBanner />
      <div className="tab-page" key={tab.path}>
        {tab.path === '/' && <Home />}
        {tab.path === '/review' && <ReviewTab />}
        {tab.path === '/progress' && <ProgressTab />}
        {tab.path === '/profile' && <ProfileTab />}
      </div>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => {
          const on = t.path === tab.path;
          return (
            <button key={t.path} type="button" className={`tab ${on ? 'tab-on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => go(t.path)} data-tab={t.label}>
              <span className="tab-icon">
                <Icon name={t.icon} size={26} weight={on ? 'fill' : 'regular'} />
                {t.path === '/review' && due > 0 && <span className="tab-dot num">{due}</span>}
              </span>
              <span className="tab-label">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
