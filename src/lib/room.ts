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
import {
  DRAW_WORDS,
  MOST_LIKELY_QUESTIONS,
  TEN_SECOND_PROMPTS,
  pick,
  randomRoomCode,
} from "./constants";
import { scoreBuzz, scoreMostLikely, scoreStoryVotes, scoreTenSecond, scoreTrueFalse, mergeScores } from "./scoring";
import type { GameData, GameId, Player, RoomDoc } from "./types";
import { GAME_ORDER } from "./types";

const ROUND_MS = 18000;

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
    case "draw_guess": {
      const drawerId = pick(ids);
      return {
        drawerId,
        word: pick(DRAW_WORDS),
        hint: "",
        guesses: {},
        sub: "hint",
      };
    }
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
    case "buzz":
      return {
        buzzN: 1,
        buzzPresses: {},
        sub: "run",
      };
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
  const gameData = initGameData(gid, data.players);
  await updateDoc(roomRef(roomId), {
    roundIndex: 0,
    step: "playing",
    gameData,
    timerEndsAt: Date.now() + ROUND_MS,
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
  const gameData = initGameData(gid, data.players);
  await updateDoc(roomRef(roomId), {
    roundIndex: nextIdx,
    step: "playing",
    gameData,
    timerEndsAt: Date.now() + ROUND_MS,
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

export function computeRoundDelta(gameId: GameId, gameData: GameData, players: Player[]): Record<string, number> {
  switch (gameId) {
    case "most_likely":
      return scoreMostLikely(gameData.votes, players);
    case "draw_guess": {
      const out: Record<string, number> = {};
      const w = gameData.guessWinner;
      if (w) out[w] = 8;
      return out;
    }
    case "true_false":
      return scoreTrueFalse(gameData.falseIndex, gameData.tfAnswers);
    case "buzz":
      return scoreBuzz(gameData.buzzPresses);
    case "ten_second":
      return scoreTenSecond(gameData.tenTexts);
    case "story_chain":
      return scoreStoryVotes(gameData.storyVotes, players);
    default:
      return {};
  }
}

export async function hostRevealScores(roomId: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const gid = GAME_ORDER[data.roundIndex]!;
  const delta = computeRoundDelta(gid, data.gameData, data.players);
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
  const votes = { ...data.gameData.votes, [voterId]: targetId };
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, votes },
    updatedAt: Date.now(),
  });
}

export async function setGuess(roomId: string, playerId: string, text: string) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const guesses = { ...data.gameData.guesses, [playerId]: text };
  const word = data.gameData.word?.toLowerCase().trim();
  const g = text.toLowerCase().trim();
  const patch: GameData = { ...data.gameData, guesses };
  const isDrawer = playerId === data.gameData.drawerId;
  if (
    word &&
    g === word &&
    !isDrawer &&
    !data.gameData.guessWinner
  ) {
    patch.guessWinner = playerId;
    patch.sub = "done";
  }
  await updateDoc(roomRef(roomId), {
    gameData: patch,
    updatedAt: Date.now(),
  });
}

export async function setHint(roomId: string, hint: string) {
  await updateGameData(roomId, { hint, sub: "guess" });
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
  const storyVotes = { ...data.gameData.storyVotes, [voterId]: targetId };
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, storyVotes },
    updatedAt: Date.now(),
  });
}

export async function buzzPress(roomId: string, playerId: string, n: number) {
  const snap = await getDoc(roomRef(roomId));
  if (!snap.exists()) return;
  const data = snap.data() as RoomDoc;
  const prev = data.gameData.buzzPresses?.[playerId];
  const t = Date.now();
  if (prev) return;
  const buzzPresses = { ...data.gameData.buzzPresses, [playerId]: { n, t } };
  await updateDoc(roomRef(roomId), {
    gameData: { ...data.gameData, buzzPresses },
    updatedAt: Date.now(),
  });
}

export async function hostSetBuzzN(roomId: string, n: number) {
  await updateGameData(roomId, { buzzN: n });
}

export { ROUND_MS };
