import { dismissNotice, hideWarning, retrySave, useHealth } from '../lib/store';
import { Icon } from './Icon';

/** Tells the learner when progress can't be saved or saved data couldn't be read. Never blocks the app. */
export function StorageBanner({ inSession = false }: { inSession?: boolean }) {
  const h = useHealth();
  const cls = inSession ? ' banner-session' : '';

  if (h.saveFailed && !h.warningHidden) {
    const msg =
      h.saveFailed === 'quota'
        ? "This device's storage is full, so new progress isn't being saved yet. Keep this tab open; we'll keep trying."
        : "This browser isn't letting Tally save (private browsing can do this). Progress lasts only while this tab is open.";
    return (
      <div className={`banner banner-warn${cls}`} role="alert" data-testid="save-warning">
        <Icon name="Info" size={20} weight="bold" />
        <p>{msg}</p>
        <div className="banner-actions">
          {h.saveFailed === 'quota' && (
            <button type="button" className="banner-btn" onClick={retrySave}>
              Try again
            </button>
          )}
          <button type="button" className="banner-btn" onClick={hideWarning}>
            Hide
          </button>
        </div>
      </div>
    );
  }

  const notice =
    h.loaded === 'unreadable'
      ? "We couldn't read your saved progress, so Tally started fresh. A copy of the old data was kept on this device."
      : h.loaded === 'newer'
        ? 'Your progress was saved by a newer version of Tally. We loaded what we could and kept a copy.'
        : h.loaded === 'repaired'
          ? "Some saved details couldn't be read and were reset. Your lessons and XP are kept."
          : null;
  if (!notice || h.noticeDismissed) return null;
  return (
    <div className={`banner${cls}`} role="status" data-testid="storage-notice">
      <Icon name="Info" size={20} weight="bold" />
      <p>{notice}</p>
      <div className="banner-actions">
        <button type="button" className="banner-btn" onClick={dismissNotice}>
          OK
        </button>
      </div>
    </div>
  );
}
