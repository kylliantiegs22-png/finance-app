/**
 * A new app version only reloads the page at a safe moment: never mid-lesson,
 * mid-review, mid-check or mid-onboarding (that would throw away the learner's
 * current session). Pure so it can be tested.
 */
export function deferredReload(env: { route: () => string; onboarded: () => boolean; reload: () => void }) {
  let pending = false;
  const safe = () => env.onboarded() && !env.route().startsWith('#/play/');
  const check = () => {
    if (pending && safe()) {
      pending = false;
      env.reload();
    }
  };
  return {
    request() {
      pending = true;
      check();
    },
    check,
  };
}
