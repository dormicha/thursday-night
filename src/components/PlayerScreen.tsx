"use client";

import { useMemo, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { gameLabel } from "@/lib/scoring";
import {
  buzzPress,
  setGuess,
  setHint,
  setStorySentence,
  setStoryVote,
  setTenText,
  setTfAnswer,
  setTrueFalseStatements,
  setVote,
} from "@/lib/room";
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
  const [hint, setHintLocal] = useState("");
  const [guess, setGuessLocal] = useState("");
  const [stmts, setStmts] = useState<[string, string, string]>(["", "", ""]);
  const [falseIx, setFalseIx] = useState(1);
  const [ten, setTen] = useState("");
  const [sentence, setSentence] = useState("");

  const nickname = me?.nickname ?? "שחקן";

  const myVote = room.gameData.votes?.[playerId];
  const myTf = room.gameData.tfAnswers?.[playerId];
  const myStoryVote = room.gameData.storyVotes?.[playerId];
  const buzzN = room.gameData.buzzN ?? 0;

  const turnPid = useMemo(() => {
    const o = room.gameData.storyOrder;
    const t = room.gameData.storyTurn ?? 0;
    if (!o) return null;
    return o[t] ?? null;
  }, [room.gameData.storyOrder, room.gameData.storyTurn]);

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
          <p className="text-lg leading-snug text-violet-100/95">{room.gameData.question}</p>
          <p className="text-sm text-violet-300/90">לחץ על מי שהכי מתאים.</p>
          <div className="grid gap-2">
            {room.players.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={!!myVote}
                onClick={() => void setVote(roomId, playerId, p.id)}
                className={`rounded-2xl py-4 text-lg font-bold transition active:scale-[0.99] ${
                  myVote === p.id
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-white/10 hover:bg-white/15"
                }`}
              >
                {p.nickname}
              </button>
            ))}
          </div>
          {myVote ? (
            <p className="text-center text-emerald-300">נשמר — בחירה טובה.</p>
          ) : null}
        </section>
      )}

      {room.step === "playing" && gid === "draw_guess" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">{gameLabel("draw_guess")}</h2>
          {room.gameData.drawerId === playerId ? (
            <>
              <p className="text-violet-100/90">תן רמז (בלי לרמות עם המילה!).</p>
              <input
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none ring-fuchsia-400 focus:ring-2"
                value={hint}
                onChange={(e) => setHintLocal(e.target.value)}
                placeholder="הרמז שלך…"
              />
              <button
                type="button"
                className="w-full rounded-2xl bg-fuchsia-500 py-4 text-lg font-bold text-white disabled:opacity-40"
                disabled={room.gameData.sub !== "hint" || !hint.trim()}
                onClick={() => void setHint(roomId, hint.trim())}
              >
                שלח רמז
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-violet-300">רמז</p>
              <p className="text-2xl font-semibold">{room.gameData.hint || "מחכים לרמז…"}</p>
              <input
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-emerald-400"
                value={guess}
                onChange={(e) => setGuessLocal(e.target.value)}
                placeholder="הניחוש שלך"
              />
              <button
                type="button"
                className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-emerald-950 disabled:opacity-40"
                disabled={room.gameData.sub !== "guess" || !guess.trim()}
                onClick={() => void setGuess(roomId, playerId, guess.trim())}
              >
                שלח ניחוש
              </button>
              {room.gameData.guesses?.[playerId] ? (
                <p className="text-center text-emerald-300">נשלח</p>
              ) : null}
            </>
          )}
        </section>
      )}

      {room.step === "playing" && gid === "true_false" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">{gameLabel("true_false")}</h2>
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
                onClick={() =>
                  void setTrueFalseStatements(roomId, stmts, falseIx as 0 | 1 | 2)
                }
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
                    disabled={myTf !== undefined || room.gameData.sub !== "pick"}
                    onClick={() => void setTfAnswer(roomId, playerId, i)}
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

      {room.step === "playing" && gid === "buzz" && (
        <section className="mt-10 flex flex-col items-center text-center">
          <h2 className="text-2xl font-black">{gameLabel("buzz")}</h2>
          <p
            className={`mt-6 text-8xl font-black tabular-nums ${
              buzzN % 7 === 0 ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.7)]" : "text-white"
            }`}
          >
            {buzzN}
          </p>
          <p className="mt-4 max-w-sm text-sm text-violet-200">
            לחץ רק כשהמספר מתחלק ב־7. לחיצה אחת. הניחוש הנכון האחרון מנצח.
          </p>
          <button
            type="button"
            disabled={!!room.gameData.buzzPresses?.[playerId] || room.gameData.sub !== "run"}
            onClick={() => void buzzPress(roomId, playerId, buzzN)}
            className="mt-8 w-full max-w-sm rounded-full bg-gradient-to-r from-orange-500 to-pink-500 py-6 text-2xl font-black text-white shadow-lg disabled:opacity-40"
          >
            באז׳
          </button>
          {room.gameData.buzzPresses?.[playerId] ? (
            <p className="mt-4 text-emerald-300">ננעל על {room.gameData.buzzPresses[playerId].n}</p>
          ) : null}
        </section>
      )}

      {room.step === "playing" && gid === "ten_second" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black">{gameLabel("ten_second")}</h2>
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
            onClick={() => void setTenText(roomId, playerId, ten)}
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
                    onClick={() => void setStorySentence(roomId, playerId, sentence.trim())}
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
              <p className="text-lg text-violet-100/90">הצבע למשפט הכי טוב.</p>
              <div className="grid gap-2">
                {room.players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!!myStoryVote}
                    onClick={() => void setStoryVote(roomId, playerId, p.id)}
                    className={`rounded-2xl py-4 text-lg font-bold ${
                      myStoryVote === p.id ? "bg-emerald-500 text-emerald-950" : "bg-white/10"
                    }`}
                  >
                    {p.nickname}
                  </button>
                ))}
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
