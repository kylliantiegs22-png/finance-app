"""Drive the built app through every screen at 390x844 and record console output.

Run (per the webapp-testing skill):
  python3 .claude/skills/webapp-testing/scripts/with_server.py \
      --server "npm run preview" --port 4173 -- python3 scripts/webapp-sweep.py

Exits non-zero if any console error, page error or failed request is seen.
Writes a log to test-results/webapp-sweep.log.
"""
import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get('URL', 'http://localhost:4173/')
CHROME = os.environ.get('CHROMIUM_PATH', '/opt/pw-browsers/chromium')

# Every question in the content, by id
Q = {}
for f in (ROOT / 'content').glob('unit*/*.json'):
    j = json.loads(f.read_text())
    for q in j.get('questions', []) + j.get('reviewBank', []) + [s['q'] for s in j.get('screens', []) if s['kind'] == 'question']:
        Q[q['id']] = q

log, problems = [], []
screen = {'name': 'start'}


def note(kind, text):
    line = f'[{screen["name"]}] {kind}: {text}'
    log.append(line)
    if kind in ('console.error', 'pageerror', 'requestfailed'):
        problems.append(line)


def answer(page, q, wrong=False):
    t = q['qtype']
    if t in ('mcq', 'blank'):
        i = (q['answer'] + 1) % len(q['options']) if wrong else q['answer']
        page.click(f'[data-opt="{i}"]')
    elif t == 'truefalse':
        page.click(f'[data-opt="{str((not q["answer"]) if wrong else q["answer"]).lower()}"]')
    elif t == 'numeric':
        page.fill('[data-testid="numeric-input"]', str(q['answer'] + (1000 if wrong else 0)))
    elif t == 'slider':
        page.fill('[data-testid="slider-input"]', str(q['answer']))
    elif t == 'match':
        n = len(q['pairs'])
        for i in range(n):
            page.click(f'[data-left="{i}"]')
            page.click(f'[data-right="{(i + 1) % n if wrong else i}"]')
    elif t == 'order':
        idx = list(range(len(q['items'])))
        for i in (reversed(idx) if wrong else idx):
            page.click(f'[data-item="{i}"]')
    elif t == 'sort':
        for i, it in enumerate(q['items']):
            b = 1 - it['bucket'] if wrong and i == 0 else it['bucket']
            page.click(f'[data-sort="{i}-{b}"]')
    elif t == 'tap':
        page.click(f'[data-row="{q["answer"]}"]')


def play(page, label, wrong_first=0):
    """Play the session on screen to its end, naming each screen for the log."""
    wrong_left = wrong_first
    for i in range(80):
        sess = page.locator('[data-testid="session"]')
        if not sess.is_visible():
            return
        kind = sess.get_attribute('data-kind')
        if kind != 'question':
            screen['name'] = f'{label} screen {i + 1} ({kind})'
            if kind == 'apply':
                page.click('.mission')
            page.click('[data-testid="continue"]')
            continue
        qid = page.get_attribute('[data-qid]', 'data-qid')
        screen['name'] = f'{label} {qid}'
        wrong = wrong_left > 0
        wrong_left -= 1
        answer(page, Q[qid], wrong)
        page.click('[data-testid="check-sure"]')
        page.wait_for_selector('[data-testid="feedback"]')
        page.click('[data-testid="feedback"] [data-testid="continue"]')
    raise RuntimeError(f'{label} did not finish')


def node(page, nid):
    page.locator(f'[data-node="{nid}"]').scroll_into_view_if_needed()
    page.click(f'[data-node="{nid}"]')
    page.click('[data-testid="node-start"]')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME)
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.on('console', lambda m: note(f'console.{m.type}', m.text) if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: note('pageerror', str(e)))
    page.on('requestfailed', lambda r: note('requestfailed', f'{r.url} {r.failure}'))

    screen['name'] = 'welcome'
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.click('[data-testid="ob-start"]')
    screen['name'] = 'onboarding question'
    page.click('[data-opt="1"]')
    page.click('[data-testid="ob-check"]')
    page.click('[data-testid="ob-next"]')
    screen['name'] = 'onboarding goal'
    page.click('[data-goal="debt"]')
    page.click('[data-testid="ob-next"]')
    screen['name'] = 'onboarding level'
    page.click('[data-level="basics"]')
    page.click('[data-testid="ob-next"]')
    screen['name'] = 'onboarding habit'
    with page.expect_download():
        page.click('[data-testid="ob-ics"]')
    page.click('[data-testid="ob-next"]')
    screen['name'] = 'onboarding promise'
    page.click('[data-testid="ob-finish"]')

    for tab in ['Review', 'Progress', 'Profile', 'Learn']:
        screen['name'] = f'tab {tab} (empty)'
        page.click(f'[data-tab="{tab}"]')
        page.wait_for_timeout(200)

    for n in range(1, 9):
        node(page, f'1.{n}')
        play(page, f'lesson 1.{n}', wrong_first=1)
        screen['name'] = f'lesson 1.{n} complete'
        page.wait_for_selector('[data-testid="complete"]')
        page.click('[data-testid="complete-continue"]')

    node(page, '1.review')
    play(page, 'unit review')
    page.click('[data-testid="complete-continue"]')
    node(page, '1.check')
    play(page, 'unit check (fail)', wrong_first=4)
    screen['name'] = 'check retry'
    page.click('[data-testid="check-again"]')
    play(page, 'unit check (pass)')
    screen['name'] = 'unit win'
    page.click('[data-testid="win-continue"]')

    for tab in ['Review', 'Progress', 'Profile']:
        screen['name'] = f'tab {tab}'
        page.click(f'[data-tab="{tab}"]')
        page.wait_for_timeout(200)
    screen['name'] = 'profile toggles'
    for t in ['dark', 'light', 'system']:
        page.click(f'[data-theme-opt="{t}"]')
    for label in ['Sounds', 'Haptics (Android)', 'Reduce motion']:
        page.get_by_label(label).click()
        page.get_by_label(label).click()
    screen['name'] = 'rescue practice'
    page.click('[data-tab="Review"]')
    page.click('[data-testid="start-rescue"]')
    play(page, 'rescue')
    page.click('[data-testid="complete-continue"]')

    screen['name'] = 'offline reload'
    page.evaluate('navigator.serviceWorker.ready')
    page.reload()
    page.wait_for_load_state('networkidle')  # don't abort in-flight requests with the next reload
    ctx.set_offline(True)
    page.reload()
    page.wait_for_selector('[data-testid="path"]')
    page.wait_for_load_state('networkidle')
    if not page.evaluate("(() => { const i = document.querySelector('.brand img'); return i.complete && i.naturalWidth > 0 })()"):
        note('pageerror', 'logo did not render offline')
    node(page, '1.5')
    play(page, 'offline lesson 1.5')
    page.click('[data-testid="complete-continue"]')
    ctx.set_offline(False)
    browser.close()

out = ROOT / 'test-results' / 'webapp-sweep.log'
out.parent.mkdir(exist_ok=True)
out.write_text('\n'.join(log) + '\n')
print('\n'.join(log) or 'no console warnings or errors')
print(f'\n{len(problems)} problem(s); {len(log)} console warning/error line(s). Log: {out}')
sys.exit(1 if problems else 0)
