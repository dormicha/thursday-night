"use client";

import { useEffect, useRef, useState } from "react";
import { playTick, resumeAudio } from "@/lib/sounds";

type Props = {
  endsAt: number | null;
};

export function Countdown({ endsAt }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const prevSec = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 200);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const left = endsAt ? Math.ceil(Math.max(0, endsAt - now) / 1000) : 0;

  useEffect(() => {
    if (!endsAt) {
      prevSec.current = null;
      return;
    }
    if (prevSec.current !== null && left < prevSec.current && left <= 5 && left >= 1) {
      resumeAudio();
      playTick();
    }
    prevSec.current = left;
  }, [endsAt, left]);

  if (!endsAt) return null;

  return (
    <div
      className={`text-5xl font-black tabular-nums transition-transform ${
        left <= 3 ? "scale-110 animate-pulse text-amber-300" : "text-white"
      }`}
    >
      {left} שנ׳
    </div>
  );
}
