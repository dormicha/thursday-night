"use client";

import { useEffect, useRef } from "react";
import { Countdown } from "@/components/Countdown";
import { gameLabel } from "@/lib/scoring";
import {
  computeRoundDelta,
  goLeaderboard,
  hostNextRound,
  hostRevealScores,
  hostSetBuzzN,
  startGame,
} from "@/lib/room";
import { playSuccess } from "@/lib/sounds";
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

export function HostScreen({ roomId, room, isHost }: Props) {
  const gid = GAME_ORDER[room.roundIndex];
  const buzzRef = useRef(room.gameData.buzzN ?? 1);

  useEffect(() => {
    buzzRef.current = room.gameData.buzzN ?? 1;
  }, [room.gameData.buzzN]);

  useEffect(() => {
    if (!isHost) return;
    if (room.step !== "playing") return;
    if (gid !== "buzz") return;
    if (room.gameData.sub !== "run") return;
    const id = window.setInterval(() => {
      const n = (buzzRef.current ?? 0) + 1;
      buzzRef.current = n;
      void hostSetBuzzN(roomId, n);
    }, 320);
    return () => window.clearInterval(id);
  }, [isHost, room.step, room.gameData.sub, gid, roomId]);

  const roundDelta =
    room.step === "round_scores" ? computeRoundDelta(gid, room.gameData, room.players) : {};

  const top = sortedPlayers(room)[0];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-violet-950 via-slate-950 to-fuchsia-950 px-6 py-10 text-white">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300/90">Thursday Night</p>
          <h1 className="mt-1 text-4xl font-black md:text-5xl">Host screen</h1>
          <p className="mt-2 text-lg text-violet-100/80">
            Room <span className="font-mono text-2xl font-bold text-white">{roomId}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {room.timerEndsAt && room.step === "playing" ? (
            <Countdown endsAt={room.timerEndsAt} />
          ) : (
            <div className="text-sm text-violet-200/70">Timer paused</div>
          )}
        </div>
      </header>

      <main className="mt-10 flex flex-1 flex-col gap-8">
        {room.step === "lobby" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-bold">Lobby</h2>
            <p className="mt-2 text-xl text-violet-100/90">Players join on their phones with this code.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {room.players.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl bg-black/30 px-4 py-3 text-lg font-semibold ring-1 ring-white/10"
                >
                  {p.nickname}
                  {p.id === room.hostId ? (
                    <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200">
                      host
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {isHost ? (
              <button
                type="button"
                className="mt-8 w-full max-w-md rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-4 text-xl font-bold shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110 active:scale-[0.99]"
                onClick={() => void startGame(roomId)}
                disabled={room.players.length < 2}
              >
                {room.players.length < 2 ? "Need at least 2 players" : "Start game"}
              </button>
            ) : null}
          </section>
        )}

        {room.step === "playing" && gid && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-300">
              Round {room.roundIndex + 1} / {GAME_ORDER.length}
            </p>
            <h2 className="mt-2 text-4xl font-black md:text-5xl">{gameLabel(gid)}</h2>
            <div className="mt-8 space-y-6 text-2xl font-medium leading-relaxed md:text-3xl">
              {gid === "most_likely" && (
                <>
                  <p className="text-violet-100/90">{room.gameData.question}</p>
                  <p className="text-lg text-violet-300/80">Players vote for who fits best.</p>
                </>
              )}
              {gid === "draw_guess" && (
                <>
                  <p className="text-5xl font-black text-amber-300 md:text-6xl">
                    {room.gameData.word?.toUpperCase()}
                  </p>
                  <p className="text-xl text-violet-200">
                    Hint: {room.gameData.hint || "— waiting —"}
                  </p>
                  {room.gameData.guessWinner ? (
                    <p className="animate-pulse text-2xl font-bold text-emerald-300">
                      First match:{" "}
                      {room.players.find((x) => x.id === room.gameData.guessWinner)?.nickname}
                    </p>
                  ) : null}
                </>
              )}
              {gid === "true_false" && (
                <>
                  <ol className="list-decimal space-y-3 pl-10">
                    {(room.gameData.statements ?? ["", "", ""]).map((s, i) => (
                      <li key={i}>{s || "…"}</li>
                    ))}
                  </ol>
                  <p className="text-lg text-violet-300">
                    Don’t read answers aloud — let phones stay secret until the reveal.
                  </p>
                </>
              )}
              {gid === "buzz" && (
                <>
                  <p
                    className={`text-7xl font-black tabular-nums md:text-9xl ${
                      (room.gameData.buzzN ?? 0) % 7 === 0 ? "text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" : "text-white"
                    }`}
                  >
                    {room.gameData.buzzN ?? 0}
                  </p>
                  <p className="text-xl text-violet-200">
                    Press when the number is divisible by 7. One press each. Last correct buzz wins.
                  </p>
                </>
              )}
              {gid === "ten_second" && (
                <>
                  <p>{room.gameData.prompt}</p>
                  <p className="text-lg text-violet-300">More words = more points (cap 20).</p>
                </>
              )}
              {gid === "story_chain" && (
                <>
                  <p className="text-lg text-violet-200">
                    Turn {Math.min((room.gameData.storyTurn ?? 0) + 1, room.gameData.storyOrder?.length ?? 0)} /{" "}
                    {room.gameData.storyOrder?.length ?? 0}
                  </p>
                  <div className="rounded-2xl bg-black/30 p-6 text-left text-2xl leading-relaxed">
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
                    playSuccess();
                    void hostRevealScores(roomId);
                  }}
                >
                  Reveal round scores
                </button>
              </div>
            ) : null}
          </section>
        )}

        {room.step === "round_scores" && (
          <section className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <h2 className="text-4xl font-black text-emerald-200">This round</h2>
            <ul className="mt-6 space-y-3 text-2xl">
              {Object.keys(roundDelta).length === 0 ? (
                <li className="text-violet-200">No points this round.</li>
              ) : (
                Object.entries(roundDelta).map(([pid, pts]) => (
                  <li key={pid} className="flex justify-between gap-4">
                    <span>{room.players.find((p) => p.id === pid)?.nickname}</span>
                    <span className="font-mono text-emerald-300">+{pts}</span>
                  </li>
                ))
              )}
            </ul>
            {isHost ? (
              <button
                type="button"
                className="mt-8 rounded-2xl bg-white px-6 py-3 text-lg font-bold text-violet-900"
                onClick={() => void goLeaderboard(roomId)}
              >
                Show leaderboard
              </button>
            ) : null}
          </section>
        )}

        {room.step === "leaderboard" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-4xl font-black">Leaderboard</h2>
            <ol className="mt-6 space-y-3 text-2xl">
              {sortedPlayers(room).map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                    i === 0 ? "bg-amber-400/20 ring-2 ring-amber-300/60" : "bg-black/20"
                  }`}
                >
                  <span>
                    {i + 1}. {p.nickname}
                  </span>
                  <span className="font-mono text-amber-200">{room.scores[p.id] ?? 0}</span>
                </li>
              ))}
            </ol>
            {isHost ? (
              <button
                type="button"
                className="mt-8 w-full max-w-md rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-4 text-xl font-bold"
                onClick={() => void hostNextRound(roomId)}
              >
                {room.roundIndex >= GAME_ORDER.length - 1 ? "Finish game" : "Next round"}
              </button>
            ) : null}
          </section>
        )}

        {room.step === "final" && top && (
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-amber-200/90">Winner</p>
            <h2 className="mt-4 animate-bounce text-6xl font-black text-amber-300 md:text-8xl">
              {top.nickname}
            </h2>
            <p className="mt-4 text-2xl text-violet-100/90">
              {room.scores[top.id] ?? 0} points
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
