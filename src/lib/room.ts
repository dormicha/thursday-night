import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { rollChaos, normalizeChaos } from "./chaos";
import {
  MOST_LIKELY_QUESTIONS,
  TEN_SECOND_PROMPTS,
  pick,
  randomRoomCode,
} from "./constants";
import { scoreMostLikely, scoreStoryVotes, scoreTenSecond, scoreTrueFalse, mergeScores } from "./scoring";
import type { ChaosRound, GameData, GameId, Player, RoomDoc } from "./types";
import { GAME_ORDER } from "./types";

/** Default countdown for most mini-games */
export const ROUND_MS = 18000;

/** Extra time for Two Truths & a Lie (write + pick answers) */
const TRUE_FALSE_ROUND_MS = 60_000;

function roundDurationMs(gameId: GameId, chaos: ChaosRound): number {
  let ms = gameId === "true_false" ? TRUE_FALSE_ROUND_MS : ROUND_MS;
  if (chaos.event === "fast_mode") ms = Math.max(5000, Math.floor(ms / 2));
  return ms;
}

function voteScoreOpts(chaos: ChaosRound) {
  const rev = chaos.event === "reverse_votes";
  const bonusTargetId = chaos.event === "bonus_target" ? chaos.bonusTargetId : undefined;
  return { reverse: rev, bonusTargetId };
}

export function computeRoundDelta(
  gameId: GameId,
  gameData: GameData,
  players: Player[],
  chaos?: ChaosRound
): Record<string, number> {
  const c = normalizeChaos(chaos);
  const vOpts = voteScoreOpts(c);
  switch (gameId) {
    case "most_likely":
      return scoreMostLikely(gameData.votes, players, vOpts);
    case "true_false":
      return scoreTrueFalse(gameData.falseIndex, gameData.tfAnswers);
    case "ten_second":
      return scoreTenSecond(gameData.tenTexts);
    case "story_chain":
      return scoreStoryVotes(gameData.storyVotes, players, vOpts);
    default:
      return {};
  }
}

function applyDoublePointsIfNeeded(delta: Record<string, number>, chaos: ChaosRound): Record<string, number> {
  if (chaos.event !== "double_points") return delta;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(delta)) {
    out[k] = v * 2;
  }
  return out;
}

/** Delta actually applied to scores after chaos (e.g. ×2). Use for UI after reveal. */
export function getRevealedRoundDelta(data: RoomDoc): Record<string, number> {
  const gid = GAME_ORDER[data.roundIndex];
  if (!gid) return {};
  const chaos = normalizeChaos(data.chaosThisRound);
  const raw = computeRoundDelta(gid, data.gameData, data.players, chaos);
  return applyDoublePointsIfNeeded(raw, chaos);
}

function roomRef(roomId: string) {
  return doc(getDb(), "rooms", roomId);
}

export function subscribeRoom(
  roomId: string,
  onData: (room: RoomDoc | null) => void,
  onListenError?: (err: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    roomRef(roomId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as RoomDoc);
    },
    onListenError
  );
}

export async function fetchRoom(roomId: string): Promise<RoomDoc | null> {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return null;
  return snap.data() as RoomDoc;
}

function initGameData(gameId: GameId, players: Player[]): GameData {
  const ids = players.map((p) => p.id);
  if (!ids.length) return { sub: "init" };

  switch (gameId) {
    case "most_likely":
      return {
        question: pick(MOST_LIKELY_QUESTIONS),
        votes: {},
        sub: "vote",
      };
    case "true_false": {
      const authorId = pick(ids);
      return {
        authorId,
        statements: ["", "", ""],
        falseIndex: 1,
        tfAnswers: {},
        sub: "write",
      };
    }
    case "ten_second":
      return {
        prompt: pick(TEN_SECOND_PROMPTS),
        tenTexts: {},
        sub: "write",
      };
    case "story_chain": {
      const shuffled = [...ids].sort(() => Math.random() - 0.5);
      return {
        storyOrder: shuffled,
        storyTurn: 0,
        sentences: {},
        storyVotes: {},
        sub: "write",
      };
    }
    default:
      return {};
  }
}

export async function createRoom(hostId: string, nickname: string): Promise<string> {
  const code = randomRoomCode();
  const now = Date.now();
  const room: RoomDoc = {
    hostId,
    players: [{ id: hostId, nickname: nickname.trim() || "Host" }],
    scores: { [hostId]: 0 },
    roundIndex: 0,
    step: "lobby",
    gameData: {},
    timerEndsAt: null,
    chaosThisRound: { event: null },
    updatedAt: now,
  };
  await setDoc(roomRef(code), room);
  return code;
}

export async function joinRoom(
  roomId: string,
  playerId: string,
  nickname: string
): Promise<boolean> {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return false;
  const data = snap.data() as RoomDoc;
  const nick = nickname.trim() || "Player";
  const others = data.players.filter((p) => p.id !== playerId);
  const nextPlayers: Player[] = [...others, { id: playerId, nickname: nick }];
  const scores = { ...data.scores };
  if (scores[playerId] === undefined) scores[playerId] = 0;
  await updateDoc(roomRef(roomId), {
    players: nextPlayers,
    scores,
    updatedAt: Date.now(),
  });
  return true;
}

export async function startGame(roomId: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const gid = GAME_ORDER[0]!;
  const chaosThisRound = rollChaos(data.players);
  const gameData = initGameData(gid, data.players);
  await updateDoc(roomRef(roomId), {
    roundIndex: 0,
    step: "playing",
    gameData,
    chaosThisRound,
    timerEndsAt: Date.now() + roundDurationMs(gid, chaosThisRound),
    updatedAt: Date.now(),
  });
}

export async function hostNextRound(roomId: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const nextIdx = data.roundIndex + 1;
  if (nextIdx >= GAME_ORDER.length) {
    await updateDoc(roomRef(roomId), {
      step: "final",
      timerEndsAt: null,
      updatedAt: Date.now(),
    });
    return;
  }
  const gid = GAME_ORDER[nextIdx]!;
  const chaosThisRound = rollChaos(data.players);
  const gameData = initGameData(gid, data.players);
  await updateDoc(roomRef(roomId), {
    roundIndex: nextIdx,
    step: "playing",
    gameData,
    chaosThisRound,
    timerEndsAt: Date.now() + roundDurationMs(gid, chaosThisRound),
    updatedAt: Date.now(),
  });
}

export async function goLeaderboard(roomId: string) {
  await updateDoc(roomRef(roomId), {
    step: "leaderboard",
    timerEndsAt: null,
    updatedAt: Date.now(),
  });
}

export async function applyRoundScores(roomId: string, delta: Record<string, number>) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const scores = mergeScores(data.scores, delta);
  await updateDoc(roomRef(roomId), {
    scores,
    step: "round_scores",
    timerEndsAt: null,
    updatedAt: Date.now(),
  });
}

export async function hostRevealScores(roomId: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const delta = getRevealedRoundDelta(data);
  await applyRoundScores(roomId, delta);
}

export async function updateGameData(roomId: string, patch: Partial<GameData>) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, ...patch },
    updatedAt: Date.now(),
  });
}

export async function setVote(roomId: string, voterId: string, targetId: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const chaos = normalizeChaos(data.chaosThisRound);
  if (chaos.event === "mute_player" && voterId === chaos.mutedPlayerId) return;
  const votes = { ...data.gameData.votes, [voterId]: targetId };
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, votes },
    updatedAt: Date.now(),
  });
}

export async function setTrueFalseStatements(
  roomId: string,
  statements: [string, string, string],
  falseIndex: number
) {
  await updateGameData(roomId, { statements, falseIndex, sub: "pick" });
}

export async function setTfAnswer(roomId: string, playerId: string, idx: number) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const chaos = normalizeChaos(data.chaosThisRound);
  if (chaos.event === "mute_player" && playerId === chaos.mutedPlayerId) return;
  if (playerId === data.gameData.authorId) return;
  const tfAnswers = { ...data.gameData.tfAnswers, [playerId]: idx };
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, tfAnswers },
    updatedAt: Date.now(),
  });
}

export async function setTenText(roomId: string, playerId: string, text: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const tenTexts = { ...data.gameData.tenTexts, [playerId]: text };
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, tenTexts },
    updatedAt: Date.now(),
  });
}

export async function setStorySentence(roomId: string, playerId: string, sentence: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const order = data.gameData.storyOrder ?? [];
  const turn = data.gameData.storyTurn ?? 0;
  if (order[turn] !== playerId) return;
  const sentences = { ...data.gameData.sentences, [playerId]: sentence };
  const nextTurn = turn + 1;
  const sub = nextTurn >= order.length ? "vote" : "write";
  await updateDoc(roomRef(roomId), {
    gameData: {
      ...data.gameData,
      sentences,
      storyTurn: nextTurn,
      sub,
    },
    updatedAt: Date.now(),
  });
}

export async function setStoryVote(roomId: string, voterId: string, targetId: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const chaos = normalizeChaos(data.chaosThisRound);
  if (chaos.event === "mute_player" && voterId === chaos.mutedPlayerId) return;
  const storyVotes = { ...data.gameData.storyVotes, [voterId]: targetId };
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, storyVotes },
    updatedAt: Date.now(),
  });
}

