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

function beep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.08) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export function playBeep() {
  beep(880, 0.06, "square", 0.06);
}

export function playSuccess() {
  beep(523, 0.08);
  setTimeout(() => beep(659, 0.1), 80);
  setTimeout(() => beep(784, 0.12), 180);
}

export function playTick() {
  beep(440, 0.04, "triangle", 0.04);
}
