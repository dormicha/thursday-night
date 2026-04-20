export type Player = {
  id: string;
  nickname: string;
};

export const GAME_ORDER = [
  "most_likely",
  "draw_guess",
  "true_false",
  "buzz",
  "ten_second",
  "story_chain",
] as const;

export type GameId = (typeof GAME_ORDER)[number];

export type RoomStep = "lobby" | "playing" | "round_scores" | "leaderboard" | "final";

export type GameData = {
  /** most_likely */
  votes?: Record<string, string>;
  question?: string;
  /** draw_guess */
  drawerId?: string;
  word?: string;
  hint?: string;
  guesses?: Record<string, string>;
  guessWinner?: string;
  /** true_false */
  authorId?: string;
  statements?: [string, string, string];
  falseIndex?: number;
  tfAnswers?: Record<string, number>;
  /** buzz */
  buzzN?: number;
  buzzPresses?: Record<string, { n: number; t: number }>;
  /** ten_second */
  prompt?: string;
  tenTexts?: Record<string, string>;
  /** story_chain */
  storyOrder?: string[];
  storyTurn?: number;
  sentences?: Record<string, string>;
  storyVotes?: Record<string, string>;
  /** sub-stage within mini-game */
  sub?: string;
};

export type RoomDoc = {
  hostId: string;
  players: Player[];
  scores: Record<string, number>;
  roundIndex: number;
  step: RoomStep;
  gameData: GameData;
  timerEndsAt: number | null;
  updatedAt: number;
};
