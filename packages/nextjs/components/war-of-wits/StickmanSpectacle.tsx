"use client";

import { useEffect, useMemo, useRef } from "react";

type StickmanSpectacleProps = {
  totalPlayers: number;
  playersRemaining: number;
  eliminationBurstKey: number;
};

type DustParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

export const StickmanSpectacle = ({ totalPlayers, playersRemaining, eliminationBurstKey }: StickmanSpectacleProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<DustParticle[]>([]);
  const phaseRef = useRef(0);

  const eliminatedCount = useMemo(() => Math.max(0, totalPlayers - playersRemaining), [playersRemaining, totalPlayers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    setSize();
    window.addEventListener("resize", setSize);

    let frame = 0;
    let rafId = 0;
    const drawStickman = (x: number, y: number, scale: number, alive: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = alive ? "#65ff9c" : "rgba(255,75,110,0.28)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = alive ? "rgba(21,255,122,0.7)" : "transparent";
      ctx.shadowBlur = alive ? 9 : 0;
      ctx.beginPath();
      ctx.arc(0, -8, 3.5, 0, Math.PI * 2);
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 8);
      ctx.moveTo(0, 0);
      ctx.lineTo(-5, 4);
      ctx.moveTo(0, 0);
      ctx.lineTo(5, 4);
      ctx.moveTo(0, 8);
      ctx.lineTo(-4, 14);
      ctx.moveTo(0, 8);
      ctx.lineTo(4, 14);
      ctx.stroke();
      ctx.restore();
    };

    const loop = () => {
      frame += 1;
      phaseRef.current += 0.04;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      const columns = Math.floor(Math.sqrt(totalPlayers) * 1.6);
      const spacingX = width / Math.max(columns, 1);
      const rows = Math.ceil(totalPlayers / Math.max(columns, 1));
      const spacingY = height / Math.max(rows + 1, 1);

      for (let i = 0; i < totalPlayers; i += 1) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = spacingX * col + spacingX * 0.5;
        const y = spacingY * row + spacingY * 0.9;
        const alive = i < playersRemaining;
        const breath = 1 + Math.sin(phaseRef.current + i * 0.09) * 0.08;
        drawStickman(x, y, breath, alive);
      }

      particlesRef.current = particlesRef.current
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.08,
          life: particle.life - 1,
        }))
        .filter(particle => particle.life > 0);

      particlesRef.current.forEach(particle => {
        const alpha = Math.max(0, particle.life / 50);
        ctx.fillStyle = `rgba(255, 86, 120, ${alpha})`;
        ctx.fillRect(particle.x, particle.y, 2, 2);
      });

      const glow = 8 + Math.sin(frame * 0.06) * 2;
      ctx.strokeStyle = "rgba(101,255,156,0.4)";
      ctx.shadowColor = "rgba(101,255,156,0.6)";
      ctx.shadowBlur = glow;
      ctx.strokeRect(1, 1, width - 2, height - 2);
      ctx.shadowBlur = 0;

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setSize);
    };
  }, [playersRemaining, totalPlayers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const burst: DustParticle[] = Array.from({ length: 80 }, () => ({
      x: width * (0.3 + Math.random() * 0.4),
      y: height * (0.35 + Math.random() * 0.2),
      vx: (Math.random() - 0.5) * 5.5,
      vy: (Math.random() - 1.2) * 4.8,
      life: 40 + Math.random() * 15,
    }));
    particlesRef.current.push(...burst);
  }, [eliminationBurstKey]);

  return (
    <section className="rounded-3xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-cyan-300/80">
        <span>Stickman Spectacle</span>
        <span>
          Alive {playersRemaining}/{totalPlayers} - Eliminated {eliminatedCount}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="h-[220px] w-full rounded-2xl bg-[radial-gradient(circle_at_center,rgba(14,35,34,0.8),rgba(2,5,8,0.95))]"
      />
    </section>
  );
};
