import { describe, expect, it, vi } from 'vitest';
import { deferredReload } from '../../src/lib/updates';

describe('app update reload policy', () => {
  const setup = (route: string, onboarded = true) => {
    const env = { route, onboarded, reload: vi.fn() };
    const r = deferredReload({ route: () => env.route, onboarded: () => env.onboarded, reload: env.reload });
    return { env, r };
  };

  it('reloads straight away when the learner is on a tab screen', () => {
    const { env, r } = setup('#/');
    r.request();
    expect(env.reload).toHaveBeenCalledTimes(1);
  });

  it('never reloads in the middle of a lesson, review or check', () => {
    for (const route of ['#/play/lesson/1.3', '#/play/review', '#/play/check/1']) {
      const { env, r } = setup(route);
      r.request();
      r.check();
      expect(env.reload).not.toHaveBeenCalled();
      env.route = '#/';
      r.check();
      expect(env.reload).toHaveBeenCalledTimes(1);
    }
  });

  it('waits until onboarding is finished', () => {
    const { env, r } = setup('', false);
    r.request();
    expect(env.reload).not.toHaveBeenCalled();
    env.onboarded = true;
    r.check();
    expect(env.reload).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no update is pending', () => {
    const { env, r } = setup('#/');
    r.check();
    expect(env.reload).not.toHaveBeenCalled();
  });
});
