"use client";

import type { ChaosRound, Player } from "@/lib/types";
import { chaosDetailHe, chaosTitleHe } from "@/lib/chaos";

type Props = {
  chaos: ChaosRound;
  players: Player[];
};

export function ChaosBanner({ chaos, players }: Props) {
  const title = chaosTitleHe(chaos);
  const detail = chaosDetailHe(chaos, players);
  if (!title || !detail) return null;

  return (
    <div className="chaos-banner mt-6 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-500/25 via-fuchsia-500/20 to-violet-600/25 px-5 py-4 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">אירוע כאוס</p>
      <p className="mt-1 text-2xl font-black text-white">{title}</p>
      <p className="mt-2 text-base font-medium leading-snug text-violet-100/95">{detail}</p>
    </div>
  );
}
