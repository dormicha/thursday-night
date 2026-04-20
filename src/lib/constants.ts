export const MOST_LIKELY_QUESTIONS = [
  "Most likely to survive a zombie apocalypse?",
  "Most likely to become famous?",
  "Most likely to be late to their own party?",
  "Most likely to cry during a commercial?",
  "Most likely to win a reality show?",
  "Most likely to forget where they parked?",
  "Most likely to adopt ten pets?",
  "Most likely to binge-watch an entire series in one day?",
];

export const DRAW_WORDS = [
  "umbrella",
  "penguin",
  "volcano",
  "birthday",
  "galaxy",
  "sandwich",
  "dragon",
  "keyboard",
  "rainbow",
  "detective",
  "cactus",
  "moonlight",
];

export const TEN_SECOND_PROMPTS = [
  "Name things you’d bring to a desert island — one per word.",
  "Words that rhyme with “game” (made-up allowed).",
  "Types of pasta — go!",
  "Things that are round.",
  "Excuses for being late.",
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function randomRoomCode(): string {
  const n = 100000 + Math.floor(Math.random() * 900000);
  return String(n);
}
