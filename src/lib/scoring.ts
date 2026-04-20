import type { GameId, Player } from "./types";

export function scoreMostLikely(
  votes: Record<string, string> | undefined,
  players: Player[]
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!votes || !players.length) return out;
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  let max = 0;
  for (const id of Object.keys(tally)) {
    max = Math.max(max, tally[id] ?? 0);
  }
  const winners = Object.keys(tally).filter((id) => tally[id] === max);
  if (!winners.length) return out;
  for (const [voter, target] of Object.entries(votes)) {
    if (winners.includes(target)) {
      out[voter] = (out[voter] ?? 0) + 3;
    }
  }
  return out;
}

export function scoreTrueFalse(
  falseIndex: number | undefined,
  answers: Record<string, number> | undefined
): Record<string, number> {
  const out: Record<string, number> = {};
  if (falseIndex === undefined || !answers) return out;
  for (const [pid, idx] of Object.entries(answers)) {
    if (idx === falseIndex) out[pid] = (out[pid] ?? 0) + 3;
  }
  return out;
}

export function scoreBuzz(
  presses: Record<string, { n: number; t: number }> | undefined
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!presses) return out;
  const correct = Object.entries(presses).filter(([, v]) => v.n % 7 === 0);
  if (!correct.length) return out;
  correct.sort((a, b) => a[1].t - b[1].t);
  const last = correct[correct.length - 1]![0];
  out[last] = 5;
  return out;
}

export function scoreTenSecond(texts: Record<string, string> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!texts) return out;
  for (const [pid, t] of Object.entries(texts)) {
    const words = t
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    out[pid] = Math.min(words.length * 2, 20);
  }
  return out;
}

export function scoreStoryVotes(
  votes: Record<string, string> | undefined,
  players: Player[]
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!votes || !players.length) return out;
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  let max = 0;
  for (const id of Object.keys(tally)) {
    max = Math.max(max, tally[id] ?? 0);
  }
  const winners = Object.keys(tally).filter((id) => tally[id] === max);
  for (const id of winners) {
    out[id] = (out[id] ?? 0) + 4;
  }
  return out;
}

export function mergeScores(
  base: Record<string, number>,
  delta: Record<string, number>
): Record<string, number> {
  const next = { ...base };
  for (const [k, v] of Object.entries(delta)) {
    next[k] = (next[k] ?? 0) + v;
  }
  return next;
}

export function gameLabel(id: GameId): string {
  const labels: Record<GameId, string> = {
    most_likely: "Most Likely To",
    draw_guess: "Draw & Guess",
    true_false: "Two Truths & a Lie",
    buzz: "Lucky 7 Buzz",
    ten_second: "10 Second Challenge",
    story_chain: "Story Chain",
  };
  return labels[id];
}
