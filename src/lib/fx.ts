/** Sound, haptics and confetti — fired together so feedback lands as one moment. */
import confetti from 'canvas-confetti';
import { getState } from './store';

export type SoundName = 'tap' | 'correct' | 'wrong' | 'complete' | 'streak' | 'badge';
const NAMES: SoundName[] = ['tap', 'correct', 'wrong', 'complete', 'streak', 'badge'];
let ctx: AudioContext | null = null;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
let loading: Promise<void> | null = null;

function ensureAudio() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) ctx = new AudioContext();
  if (!loading) {
    const base = import.meta.env.BASE_URL;
    loading = Promise.all(
      NAMES.map(async (n) => {
        try {
          const r = await fetch(`${base}sounds/${n}.wav`);
          buffers[n] = await ctx!.decodeAudioData(await r.arrayBuffer());
        } catch {
          /* offline before cache or unsupported: stay silent */
        }
      }),
    ).then(() => undefined);
  }
  return ctx;
}

export function play(name: SoundName, volume = 0.6) {
  if (!getState().settings.sound) return;
  const c = ensureAudio();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const go = () => {
    const b = buffers[name];
    if (!b) return;
    const src = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.value = volume;
    src.buffer = b;
    src.connect(gain).connect(c.destination);
    src.start();
  };
  if (buffers[name]) go();
  else void loading?.then(go);
}

export function haptic(pattern: number | number[]) {
  if (!getState().settings.haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported (iPhone Safari) */
  }
}

export function reducedMotion(): boolean {
  const pref = getState().settings.motion;
  if (pref === 'reduced') return true;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const BRAND = ['#4F46E5', '#7C3AED', '#10B981', '#FBBF24', '#818CF8'];

/** Medium celebration: brand confetti burst at lesson end. */
export function confettiBurst() {
  if (reducedMotion()) return;
  const opts = { colors: BRAND, disableForReducedMotion: true, zIndex: 60 };
  confetti({ ...opts, particleCount: 70, spread: 70, startVelocity: 42, origin: { x: 0.5, y: 0.35 }, scalar: 0.9 });
  setTimeout(() => confetti({ ...opts, particleCount: 40, spread: 100, startVelocity: 30, origin: { x: 0.5, y: 0.3 }, scalar: 0.8 }), 180);
}

/** Large celebration: side cannons for the full-screen unit win. */
export function confettiCannons() {
  if (reducedMotion()) return;
  const opts = { colors: [...BRAND, '#F97316'], disableForReducedMotion: true, zIndex: 60 };
  const end = Date.now() + 1200;
  (function frame() {
    confetti({ ...opts, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    confetti({ ...opts, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
