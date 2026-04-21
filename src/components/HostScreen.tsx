"use client";

import { useEffect, useRef } from "react";
import { AnimatedLeaderboard } from "@/components/AnimatedLeaderboard";
import { ChaosBanner } from "@/components/ChaosBanner";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { Countdown } from "@/components/Countdown";
import { normalizeChaos } from "@/lib/chaos";
import { gameLabel } from "@/lib/scoring";
import {
  getRevealedRoundDelta,
  goLeaderboard,
  hostNextRound,
  hostRevealScores,
  startGame,
} from "@/lib/room";
import { playButtonClick, playCorrect, playWinner } from "@/lib/sounds";
import type { RoomDoc } from "@/lib/types";
import { GAME_ORDER } from "@/lib/types";

type Props = {
  roomId: string;
  room: RoomDoc;
  isHost: boolean;
};

function sortedPlayers(room: RoomDoc) {
  return [...room.players].sort((a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0));
}

function roundTopIds(delta: Record<string, number>): string[] {
  const vals = Object.values(delta);
  if (!vals.length) return [];
  const m = Math.max(...vals);
  if (m <= 0) return [];
  return Object.entries(delta)
    .filter(([, v]) => v === m)
    .map(([id]) => id);
}

export function HostScreen({ roomId, room, isHost }: Props) {
  const gid = GAME_ORDER[room.roundIndex];
  const chaos = normalizeChaos(room.chaosThisRound);
  const playedFinal = useRef(false);

  const roundDelta =
    room.step === "round_scores" || room.step === "leaderboard" ? getRevealedRoundDelta(room) : {};

  const top = sortedPlayers(room)[0];
  const confettiKey = `lb-${room.roundIndex}`;

  useEffect(() => {
    if (room.step !== "final") {
      playedFinal.current = false;
      return;
    }
    if (playedFinal.current) return;
    playedFinal.current = true;
    playWinner();
  }, [room.step]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gradient-to-br from-violet-950 via-slate-950 to-fuchsia-950 px-6 py-10 text-white">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300/90">Thursday Night</p>
          <h1 className="mt-1 text-4xl font-black md:text-5xl">מסך מנחה</h1>
          <p className="mt-2 text-lg text-violet-100/80">
            חדר <span className="font-mono text-2xl font-bold text-white">{roomId}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {room.timerEndsAt && room.step === "playing" ? (
            <Countdown endsAt={room.timerEndsAt} />
          ) : (
            <div className="text-sm text-violet-200/70">הטיימר מושהה</div>
          )}
        </div>
      </header>

      <main className="mt-10 flex flex-1 flex-col gap-8">
        {room.step === "lobby" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-bold">לובי</h2>
            <p className="mt-2 text-xl text-violet-100/90">השחקנים מצטרפים מהטלפון עם הקוד הזה.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {room.players.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-2xl bg-black/30 px-4 py-3 text-lg font-semibold ring-1 ring-white/10"
                >
                  <span>{p.nickname}</span>
                  {p.id === room.hostId ? (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200">
                      מנחה
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {isHost ? (
              <button
                type="button"
                className="mt-8 w-full max-w-md rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-4 text-xl font-bold shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 active:scale-[0.99]"
                onClick={() => {
                  playButtonClick();
                  void startGame(roomId);
                }}
                disabled={room.players.length < 2}
              >
                {room.players.length < 2 ? "נדרשים לפחות 2 שחקנים" : "התחל משחק"}
              </button>
            ) : null}
          </section>
        )}

        {room.step === "playing" && gid && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-300">
              סיבוב {room.roundIndex + 1} מתוך {GAME_ORDER.length}
            </p>
            <h2 className="mt-2 text-4xl font-black md:text-5xl">{gameLabel(gid)}</h2>
            <ChaosBanner chaos={chaos} players={room.players} />
            <div className="mt-8 space-y-6 text-2xl font-medium leading-relaxed md:text-3xl">
              {gid === "most_likely" && (
                <>
                  <p className="text-violet-100/90">{room.gameData.question}</p>
                  <p className="text-lg text-violet-300/80">
                    {chaos.event === "reverse_votes"
                      ? "הפעם: מצביעים למי שמתאים הכי פחות (כי מנצח המיעוט!)."
                      : "מצביעים למי שמתאים הכי הרבה."}
                  </p>
                </>
              )}
              {gid === "true_false" && (
                <>
                  <ol className="list-decimal space-y-3 pr-10">
                    {(room.gameData.statements ?? ["", "", ""]).map((s, i) => (
                      <li key={i}>{s || "…"}</li>
                    ))}
                  </ol>
                  <p className="text-lg text-violet-300">
                    אל תקריא את התשובות בקול — בטלפונים זה נשאר סודי עד החשיפה.
                  </p>
                </>
              )}
              {gid === "ten_second" && (
                <>
                  <p>{room.gameData.prompt}</p>
                  <p className="text-lg text-violet-300">יותר מילים = יותר נקודות (מקסימום 20).</p>
                </>
              )}
              {gid === "story_chain" && (
                <>
                  <p className="text-lg text-violet-200">
                    תור {Math.min((room.gameData.storyTurn ?? 0) + 1, room.gameData.storyOrder?.length ?? 0)}{" "}
                    מתוך {room.gameData.storyOrder?.length ?? 0}
                  </p>
                  {chaos.event === "reverse_votes" ? (
                    <p className="text-lg font-semibold text-amber-200/95">
                      כאוס: הניצחון לזה שקיבל הכי מעט קולות!
                    </p>
                  ) : null}
                  <div className="rounded-2xl bg-black/30 p-6 text-right text-2xl leading-relaxed">
                    {(room.gameData.storyOrder ?? []).map((pid) => {
                      const p = room.players.find((x) => x.id === pid);
                      const s = room.gameData.sentences?.[pid];
                      return (
                        <p key={pid}>
                          <span className="text-fuchsia-300">{p?.nickname}:</span> {s || "…"}
                        </p>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {isHost ? (
              <div className="mt-10 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl bg-emerald-500 px-6 py-3 text-lg font-bold text-emerald-950 shadow-lg"
                  onClick={() => {
                    playButtonClick();
                    playCorrect();
                    void hostRevealScores(roomId);
                  }}
                >
                  חשוף נקודות סיבוב
                </button>
              </div>
            ) : null}
          </section>
        )}

        {room.step === "round_scores" && (
          <section className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <h2 className="text-4xl font-black text-emerald-200">הסיבוב הזה</h2>
            <ul className="mt-6 space-y-3 text-2xl">
              {Object.keys(roundDelta).length === 0 ? (
                <li className="text-violet-200">אין נקודות בסיבוב הזה.</li>
              ) : (
                Object.entries(roundDelta).map(([pid, pts]) => (
                  <li key={pid} className="flex justify-between gap-4">
                    <span>{room.players.find((p) => p.id === pid)?.nickname}</span>
                    <span className="font-mono text-emerald-300">+{pts}</span>
                  </li>
                ))
              )}
            </ul>
            {roundTopIds(roundDelta).length ? (
              <p className="mt-6 text-lg text-amber-200/90">
                כוכבי הסיבוב:{" "}
                {roundTopIds(roundDelta)
                  .map((id) => room.players.find((p) => p.id === id)?.nickname)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
            {isHost ? (
              <button
                type="button"
                className="mt-8 rounded-2xl bg-white px-6 py-3 text-lg font-bold text-violet-900"
                onClick={() => {
                  playButtonClick();
                  void goLeaderboard(roomId);
                }}
              >
                הצג לוח תוצאות
              </button>
            ) : null}
          </section>
        )}

        {room.step === "leaderboard" && (
          <section className="relative min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8">
            <ConfettiBurst key={confettiKey} active={roundTopIds(roundDelta).length > 0} />
            <h2 className="text-4xl font-black">לוח תוצאות</h2>
            <p className="mt-2 text-violet-200/90">עדכון אחרי הסיבוב — שימו לב למקום החדש.</p>
            <AnimatedLeaderboard room={room} roundDelta={roundDelta} />
            {isHost ? (
              <button
                type="button"
                className="relative z-20 mt-8 w-full max-w-md rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-4 text-xl font-bold"
                onClick={() => {
                  playButtonClick();
                  void hostNextRound(roomId);
                }}
              >
                {room.roundIndex >= GAME_ORDER.length - 1 ? "סיום משחק" : "סיבוב הבא"}
              </button>
            ) : null}
          </section>
        )}

        {room.step === "final" && top && (
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-amber-200/90">מנצח</p>
            <h2 className="mt-4 animate-bounce text-6xl font-black text-amber-300 md:text-8xl">
              👑 {top.nickname}
            </h2>
            <p className="mt-4 text-2xl text-violet-100/90">
              {room.scores[top.id] ?? 0} נקודות
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
