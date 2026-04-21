let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export function resumeAudio(): void {
  void audio()?.resume();
}

function beep(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.08,
  when = 0
) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** Short UI click */
export function playButtonClick() {
  resumeAudio();
  beep(1200, 0.035, "square", 0.045);
}

/** Countdown last seconds — soft tick */
export function playTick() {
  beep(440, 0.04, "triangle", 0.04);
}

/** Steady ticking (slightly softer) for longer countdown */
export function playTickSoft() {
  beep(330, 0.03, "sine", 0.028);
}

/** Time ran out */
export function playTimesUp() {
  resumeAudio();
  const c = audio();
  if (!c) return;
  beep(180, 0.25, "sawtooth", 0.06);
  beep(140, 0.35, "sawtooth", 0.05, 0.22);
}

/** Correct / points reveal */
export function playCorrect() {
  resumeAudio();
  beep(784, 0.07, "sine", 0.07);
  beep(988, 0.09, "sine", 0.08, 0.08);
  beep(1318, 0.14, "triangle", 0.06, 0.18);
}

/** Round cleared — three-note upward (kept for compatibility) */
export function playSuccess() {
  playCorrect();
}

/** Final winner fanfare */
export function playWinner() {
  resumeAudio();
  const notes = [523, 659, 784, 1046, 784, 1046, 1318];
  let t = 0;
  for (const f of notes) {
    beep(f, 0.11, "sine", 0.065, t);
    t += 0.12;
  }
}
