"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
  size: number;
};

const COLORS = ["#f472b6", "#c084fc", "#34d399", "#fbbf24", "#38bdf8", "#fb7185"];

type Props = {
  active: boolean;
  pieceCount?: number;
};

export function ConfettiBurst({ active, pieceCount = 90 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxRaw = canvas.getContext("2d");
    if (!ctxRaw) return;
    const ctx = ctxRaw;

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    for (let i = 0; i < pieceCount; i++) {
      const angle = (Math.PI * 2 * i) / pieceCount + Math.random() * 0.5;
      const speed = 6 + Math.random() * 10;
      particles.push({
        x: w / 2,
        y: h * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        size: 4 + Math.random() * 5,
      });
    }

    let start = performance.now();
    const duration = 2800;

    function frame(now: number) {
      const elapsed = now - start;
      const t = elapsed / duration;
      ctx.clearRect(0, 0, w, h);
      const g = 0.35;
      for (const p of particles) {
        p.vy += g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - t * 1.1);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, pieceCount]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      aria-hidden
    />
  );
}
