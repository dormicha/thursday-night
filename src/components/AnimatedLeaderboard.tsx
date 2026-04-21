"use client";

import { useMemo } from "react";
import type { RoomDoc } from "@/lib/types";

type Props = {
  room: RoomDoc;
  roundDelta: Record<string, number>;
};

function sortedIdsByScores(scores: Record<string, number>, playerIds: string[]) {
  return [...playerIds].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
}

export function AnimatedLeaderboard({ room, roundDelta }: Props) {
  const playerIds = room.players.map((p) => p.id);

  const prevScores = useMemo(() => {
    const s = { ...room.scores };
    for (const [pid, d] of Object.entries(roundDelta)) {
      s[pid] = (s[pid] ?? 0) - d;
    }
    return s;
  }, [room.scores, roundDelta]);

  const orderNow = useMemo(
    () => sortedIdsByScores(room.scores, playerIds),
    [room.scores, playerIds]
  );

  const orderPrev = useMemo(
    () => sortedIdsByScores(prevScores, playerIds),
    [prevScores, playerIds]
  );

  return (
    <ol className="relative mt-6 space-y-3 text-2xl">
      {orderNow.map((pid, i) => {
        const p = room.players.find((x) => x.id === pid);
        const prevIdx = orderPrev.indexOf(pid);
        const moved = prevIdx !== -1 && prevIdx !== i;
        const movedUp = prevIdx > i;
        return (
          <li
            key={pid}
            className={`lb-row flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-700 ease-out ${
              i === 0
                ? "lb-first bg-amber-400/25 ring-2 ring-amber-300/80 shadow-[0_0_28px_rgba(251,191,36,0.35)]"
                : moved
                  ? movedUp
                    ? "bg-emerald-500/15 ring-1 ring-emerald-400/40"
                    : "bg-rose-500/10 ring-1 ring-rose-400/30"
                  : "bg-black/20"
            } ${moved ? (movedUp ? "lb-nudge-up" : "lb-nudge-down") : ""}`}
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <span className="flex items-center gap-2">
              <span className="tabular-nums text-violet-300/90">{i + 1}.</span>
              {i === 0 ? <span className="text-2xl leading-none">👑</span> : null}
              <span className="font-semibold">{p?.nickname}</span>
            </span>
            <span className="font-mono text-amber-200">{room.scores[pid] ?? 0}</span>
          </li>
        );
      })}
    </ol>
  );
}
