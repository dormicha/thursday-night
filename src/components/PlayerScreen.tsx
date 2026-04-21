"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChaosBanner } from "@/components/ChaosBanner";
import { Countdown } from "@/components/Countdown";
import { normalizeChaos } from "@/lib/chaos";
import {
  getRevealedRoundDelta,
  setStorySentence,
  setStoryVote,
  setTenText,
  setTfAnswer,
  setTrueFalseStatements,
  setVote,
} from "@/lib/room";
import { gameLabel } from "@/lib/scoring";
import { playButtonClick, playCorrect } from "@/lib/sounds";
import type { RoomDoc } from "@/lib/types";
import { GAME_ORDER } from "@/lib/types";

type Props = {
  roomId: string;
  room: RoomDoc;
  playerId: string;
};

export function PlayerScreen({ roomId, room, playerId }: Props) {
  const me = room.players.find((p) => p.id === playerId);
  const gid = GAME_ORDER[room.roundIndex];
  const chaos = normalizeChaos(room.chaosThisRound);
  const [stmts, setStmts] = useState<[string, string, string]>(["", "", ""]);
  const [falseIx, setFalseIx] = useState(1);
  const [ten, setTen] = useState("");
  const [sentence, setSentence] = useState("");
  const playedGainRef = useRef(false);

  const nickname = me?.nickname ?? "שחקן";

  const myVote = room.gameData.votes?.[playerId];
  const myTf = room.gameData.tfAnswers?.[playerId];
  const myStoryVote = room.gameData.storyVotes?.[playerId];
  const muted =
    chaos.event === "mute_player" && chaos.mutedPlayerId === playerId;
  const bonusId = chaos.event === "bonus_target" ? chaos.bonusTargetId : undefined;

  const turnPid = useMemo(() => {
    const o = room.gameData.storyOrder;
    const t = room.gameData.storyTurn ?? 0;
    if (!o) return null;
    return o[t] ?? null;
  }, [room.gameData.storyOrder, room.gameData.storyTurn]);

  useEffect(() => {
    if (room.step !== "round_scores") {
      playedGainRef.current = false;
      return;
    }
    const delta = getRevealedRoundDelta(room);
    const gain = delta[playerId] ?? 0;
    if (gain > 0 && !playedGainRef.current) {
      playedGainRef.current = true;
      playCorrect();
    }
  }, [room.step, room, playerId]);

  if (!playerId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <p>טוען…</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4 text-white">
        <p className="text-center text-lg">אתה לא בחדר הזה. התחבר מחדש מדף הבית.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 to-violet-950 px-4 py-8 text-white">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-violet-300/80">אתה</p>
          <p className="text-xl font-bold">{nickname}</p>
        </div>
        {room.timerEndsAt && room.step === "playing" ? (
          <Countdown endsAt={room.timerEndsAt} />
        ) : null}
      </header>

      {room.step === "lobby" && (
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-lg text-violet-100/90">רגע — המנחה יתחיל את המשחק.</p>
          <p className="mt-2 font-mono text-3xl font-black tracking-widest text-white">{roomId}</p>
        </section>
      )}

      {room.step === "playing" && gid === "most_likely" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">{gameLabel("most_likely")}</h2>
          <ChaosBanner chaos={chaos} players={room.players} />
          <p className="text-lg leading-snug text-violet-100/95">{room.gameData.question}</p>
          <p className="text-sm text-violet-300/90">
            {chaos.event === "reverse_votes"
              ? "לחץ על מי שהכי פחות מתאים (מנצח המיעוט!)."
              : "לחץ על מי שהכי מתאים."}
          </p>
          {muted ? (
            <p className="rounded-xl bg-rose-500/20 px-4 py-3 text-center text-rose-200">
              כאוס: אתה מושתק בסיבוב הזה — בלי הצבעה.
            </p>
          ) : null}
          <div className="grid gap-2">
            {room.players.map((p) => {
              const isBonus = bonusId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!!myVote || muted}
                  onClick={() => {
                    playButtonClick();
                    void setVote(roomId, playerId, p.id);
                  }}
                  className={`rounded-2xl py-4 text-lg font-bold transition active:scale-[0.99] ${
                    myVote === p.id
                      ? "bg-emerald-500 text-emerald-950"
                      : isBonus
                        ? "bg-amber-400/25 ring-2 ring-amber-300/70 hover:bg-amber-400/35"
                        : "bg-white/10 hover:bg-white/15"
                  }`}
                >
                  {p.nickname}
                  {isBonus ? " ✨" : ""}
                </button>
              );
            })}
          </div>
          {myVote ? (
            <p className="text-center text-emerald-300">נשמר — בחירה טובה.</p>
          ) : null}
        </section>
      )}

      {room.step === "playing" && gid === "true_false" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">{gameLabel("true_false")}</h2>
          <ChaosBanner chaos={chaos} players={room.players} />
          {muted && room.gameData.authorId !== playerId ? (
            <p className="rounded-xl bg-rose-500/20 px-4 py-3 text-center text-rose-200">
              כאוס: אתה מושתק — לא ניתן לבחור תשובה בסיבוב הזה.
            </p>
          ) : null}
          {room.gameData.authorId === playerId ? (
            <>
              <p className="text-violet-100/90">כתוב שתי אמיתות ושקר אחד.</p>
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
                  value={stmts[i]}
                  onChange={(e) => {
                    const next = [...stmts] as [string, string, string];
                    next[i] = e.target.value;
                    setStmts(next);
                  }}
                  placeholder={`משפט ${i + 1}`}
                />
              ))}
              <label className="block text-sm text-violet-300">
                איזו שורה היא השקר?
                <select
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-lg"
                  value={falseIx}
                  onChange={(e) => setFalseIx(Number(e.target.value))}
                >
                  <option value={0}>#1</option>
                  <option value={1}>#2</option>
                  <option value={2}>#3</option>
                </select>
              </label>
              <button
                type="button"
                className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-bold text-amber-950 disabled:opacity-40"
                disabled={room.gameData.sub !== "write"}
                onClick={() => {
                  playButtonClick();
                  void setTrueFalseStatements(roomId, stmts, falseIx as 0 | 1 | 2);
                }}
              >
                נעל משפטים
              </button>
            </>
          ) : (
            <>
              {room.gameData.sub === "write" ? (
                <p className="text-lg text-violet-200">מחכים שהכותב יסיים…</p>
              ) : null}
              <ol className="list-decimal space-y-2 pr-6 text-lg">
                {(room.gameData.statements ?? ["", "", ""]).map((s, i) => (
                  <li key={i}>{s || "…"}</li>
                ))}
              </ol>
              <p className="text-sm text-violet-300">איפה השקר?</p>
              <div className="grid gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={myTf !== undefined || room.gameData.sub !== "pick" || muted}
                    onClick={() => {
                      playButtonClick();
                      void setTfAnswer(roomId, playerId, i);
                    }}
                    className={`rounded-2xl py-4 text-lg font-bold ${
                      myTf === i ? "bg-emerald-500 text-emerald-950" : "bg-white/10"
                    }`}
                  >
                    #{i + 1}
                  </button>
                ))}
              </div>
              {myTf !== undefined ? <p className="text-emerald-300">התשובה נשמרה.</p> : null}
            </>
          )}
        </section>
      )}

      {room.step === "playing" && gid === "ten_second" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">{gameLabel("ten_second")}</h2>
          <ChaosBanner chaos={chaos} players={room.players} />
          <p className="text-lg text-violet-100/95">{room.gameData.prompt}</p>
          <textarea
            className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-violet-400"
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            placeholder="הקלד כמה שיותר מילים…"
          />
          <button
            type="button"
            className="w-full rounded-2xl bg-violet-500 py-4 text-lg font-bold disabled:opacity-40"
            disabled={room.gameData.tenTexts?.[playerId] !== undefined || !ten.trim()}
            onClick={() => {
              playButtonClick();
              void setTenText(roomId, playerId, ten);
            }}
          >
            שלח
          </button>
          {room.gameData.tenTexts?.[playerId] !== undefined ? (
            <p className="text-center text-emerald-300">התשובה נשמרה.</p>
          ) : null}
        </section>
      )}

      {room.step === "playing" && gid === "story_chain" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">{gameLabel("story_chain")}</h2>
          <ChaosBanner chaos={chaos} players={room.players} />
          {room.gameData.sub === "write" && (
            <>
              {turnPid === playerId ? (
                <>
                  <p className="text-violet-100/90">הוסף משפט לסיפור.</p>
                  <textarea
                    className="min-h-[100px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-fuchsia-400"
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    placeholder="משפט קצר…"
                  />
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-fuchsia-500 py-4 text-lg font-bold disabled:opacity-40"
                    disabled={!sentence.trim() || !!room.gameData.sentences?.[playerId]}
                    onClick={() => {
                      playButtonClick();
                      void setStorySentence(roomId, playerId, sentence.trim());
                    }}
                  >
                    הוסף משפט
                  </button>
                </>
              ) : (
                <p className="text-lg text-violet-200">
                  מחכים ל־
                  <span className="font-bold text-white">
                    {room.players.find((p) => p.id === turnPid)?.nickname ?? "…"}
                  </span>
                  …
                </p>
              )}
              <div className="rounded-2xl bg-black/30 p-4 text-right text-base leading-relaxed text-violet-100/90">
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
          {room.gameData.sub === "vote" && (
            <>
              <p className="text-lg text-violet-100/90">
                {chaos.event === "reverse_votes"
                  ? "הצבע למשפט שהכי פחות אהבת (מנצח המיעוט!)."
                  : "הצבע למשפט הכי טוב."}
              </p>
              {muted ? (
                <p className="rounded-xl bg-rose-500/20 px-4 py-3 text-center text-rose-200">
                  כאוס: אתה מושתק — בלי הצבעה בסיבוב הזה.
                </p>
              ) : null}
              <div className="grid gap-2">
                {room.players.map((p) => {
                  const isBonus = bonusId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!!myStoryVote || muted}
                      onClick={() => {
                        playButtonClick();
                        void setStoryVote(roomId, playerId, p.id);
                      }}
                      className={`rounded-2xl py-4 text-lg font-bold ${
                        myStoryVote === p.id
                          ? "bg-emerald-500 text-emerald-950"
                          : isBonus
                            ? "bg-amber-400/25 ring-2 ring-amber-300/70"
                            : "bg-white/10"
                      }`}
                    >
                      {p.nickname}
                      {isBonus ? " ✨" : ""}
                    </button>
                  );
                })}
              </div>
              {myStoryVote ? <p className="text-emerald-300">ההצבעה נשמרה.</p> : null}
            </>
          )}
        </section>
      )}

      {(room.step === "round_scores" || room.step === "leaderboard" || room.step === "final") && (
        <section className="mt-12 text-center">
          <p className="text-lg text-violet-200">הסתכלו על הטלוויזיה לניקוד ולסיפור.</p>
        </section>
      )}
    </div>
  );
}
