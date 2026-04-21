import type { GameId, Player } from "./types";

export type VoteScoreOptions = {
  reverse?: boolean;
  bonusTargetId?: string;
};

export function scoreMostLikely(
  votes: Record<string, string> | undefined,
  players: Player[],
  opts?: VoteScoreOptions
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!votes || !players.length) return out;
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  const keys = Object.keys(tally);
  if (!keys.length) return out;
  const reverse = !!opts?.reverse;
  let extremum = reverse ? Infinity : 0;
  for (const id of keys) {
    const v = tally[id] ?? 0;
    extremum = reverse ? Math.min(extremum, v) : Math.max(extremum, v);
  }
  const winners = keys.filter((id) => (tally[id] ?? 0) === extremum);
  if (!winners.length) return out;
  const bonusTargetId = opts?.bonusTargetId;
  for (const [voter, target] of Object.entries(votes)) {
    if (winners.includes(target)) {
      out[voter] = (out[voter] ?? 0) + 3;
    }
    if (bonusTargetId && target === bonusTargetId) {
      out[voter] = (out[voter] ?? 0) + 2;
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
  players: Player[],
  opts?: VoteScoreOptions
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!votes || !players.length) return out;
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  const keys = Object.keys(tally);
  if (!keys.length) return out;
  const reverse = !!opts?.reverse;
  let extremum = reverse ? Infinity : 0;
  for (const id of keys) {
    const v = tally[id] ?? 0;
    extremum = reverse ? Math.min(extremum, v) : Math.max(extremum, v);
  }
  const winners = keys.filter((id) => (tally[id] ?? 0) === extremum);
  const bonusTargetId = opts?.bonusTargetId;
  for (const id of winners) {
    let pts = 4;
    if (bonusTargetId && id === bonusTargetId) pts += 3;
    out[id] = (out[id] ?? 0) + pts;
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
    most_likely: "הכי סביר ש…",
    true_false: "שתי אמיתות ושקר",
    ten_second: "אתגר 10 שניות",
    story_chain: "שרשרת סיפור",
  };
  return labels[id];
}
