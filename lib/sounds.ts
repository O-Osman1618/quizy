/**
 * Tiny sound-effect engine built on the Web Audio API.
 * Every sound is synthesized, so there are no audio files to load.
 */

const STORAGE_KEY = "quizy-muted";

let ctx: AudioContext | null = null;
let muted = false;
let loaded = false;
const listeners = new Set<() => void>();

function loadMuted() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage may be unavailable (private mode); default to sound on.
  }
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMuted() {
  loadMuted();
  return muted;
}

export function getServerMuted() {
  return false;
}

export function setMuted(value: boolean) {
  muted = value;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // Browsers start the context suspended until a user gesture.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Tone = {
  freq: number;
  /** seconds after the sound starts */
  at: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  /** optional pitch glide target */
  slideTo?: number;
};

function play(tones: Tone[]) {
  loadMuted();
  if (muted) return;
  const audio = getContext();
  if (!audio) return;

  const now = audio.currentTime;
  for (const t of tones) {
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const start = now + t.at;
    const end = start + t.duration;
    const peak = t.gain ?? 0.25;

    osc.type = t.type ?? "sine";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(t.slideTo, end);
    }

    // Quick attack and smooth decay avoids clicks.
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(peak, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(amp).connect(audio.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

/** Light pop for buttons. */
export function playTap() {
  play([{ freq: 520, slideTo: 880, at: 0, duration: 0.09, gain: 0.2 }]);
}

/** Cheerful rising "ding-ding". */
export function playCorrect() {
  play([
    { freq: 880, at: 0, duration: 0.25, type: "triangle", gain: 0.3 },
    { freq: 1319, at: 0.12, duration: 0.4, type: "triangle", gain: 0.3 },
  ]);
}

/** Soft, low "boop" - gentle on purpose. */
export function playWrong() {
  play([{ freq: 240, slideTo: 150, at: 0, duration: 0.32, gain: 0.22 }]);
}

/** Short fanfare for the celebration screen. */
export function playCelebrate() {
  const notes = [523, 659, 784, 1047];
  play([
    ...notes.map((freq, i) => ({
      freq,
      at: i * 0.13,
      duration: 0.22,
      type: "triangle" as const,
      gain: 0.28,
    })),
    { freq: 1319, at: 0.55, duration: 0.7, type: "triangle", gain: 0.28 },
    { freq: 1047, at: 0.55, duration: 0.7, type: "sine", gain: 0.2 },
    { freq: 784, at: 0.55, duration: 0.7, type: "sine", gain: 0.15 },
  ]);
}

/** Soft encouraging tone for the try-again screen. */
export function playTryAgain() {
  play([
    { freq: 392, at: 0, duration: 0.3, gain: 0.2 },
    { freq: 523, at: 0.2, duration: 0.5, gain: 0.2 },
  ]);
}
