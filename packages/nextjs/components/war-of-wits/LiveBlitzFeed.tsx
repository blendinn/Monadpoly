"use client";

import type { EliminationItem, WinnerItem } from "./types";
import { motion } from "framer-motion";

type LiveBlitzFeedProps = {
  winners: WinnerItem[];
  eliminations: EliminationItem[];
};

const WinnerCard = ({ item }: { item: WinnerItem }) => (
  <div className="rounded-lg border border-[#15ff7a]/35 bg-[#08150f]/90 px-3 py-2 shadow-[0_0_14px_rgba(21,255,122,0.25)]">
    <p className="font-mono text-xs font-semibold text-[#72ffb0]">&gt; {item.playerName}</p>
  </div>
);

export const LiveBlitzFeed = ({ winners, eliminations }: LiveBlitzFeedProps) => {
  const safeWinners = winners.length > 0 ? winners : [{ id: "seed-selahaddin", playerName: "Selahaddin" }];
  const safeEliminations = eliminations ?? [];
  const winnerMarquee = [...safeWinners, ...safeWinners].slice(0, 6);
  const eliminationMarquee = [...safeEliminations, ...safeEliminations].slice(0, 6);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#171922]/70 p-4 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(131,110,251,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(63,212,255,0.08),transparent_45%)]" />
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1fr_90px_1fr]">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#20ff83]">Blitz Winner Feed</h3>
          <div className="mt-3 space-y-2">
            {winnerMarquee.map((item, index) => (
              <WinnerCard key={`${item.id}-${index}`} item={item} />
            ))}
          </div>
        </div>
        <div className="relative hidden items-center justify-center md:flex">
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 w-[4px] rounded-full bg-[#2bff7a]/70 shadow-[0_0_22px_rgba(43,255,122,0.9)]"
          />
          <motion.div
            animate={{ y: [0, -20] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            className="relative h-full w-full"
          >
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={`chain-${index}`}
                className="absolute left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-[#9dffc5] bg-[#18ff7f]/20 shadow-[0_0_12px_rgba(24,255,127,0.8)]"
                style={{ top: `${index * 38}px` }}
              />
            ))}
          </motion.div>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.22em] text-[#ff6689]">Sabotage Feed</h4>
          <div className="mt-3 space-y-2">
            {eliminationMarquee.length > 0 ? (
              eliminationMarquee.map((entry, index) => (
                <p
                  key={`${entry.id}-${index}`}
                  className="rounded-lg border border-[#ff315f]/30 bg-[#220d15]/80 px-3 py-2 font-mono text-xs text-[#ffb2c3]"
                >
                  &gt; {entry.playerName} - {entry.wrongAnswer}
                </p>
              ))
            ) : (
              <p className="rounded-lg border border-[#ff315f]/30 bg-[#220d15]/80 px-3 py-2 font-mono text-xs text-[#ff9cb4]/70">
                &gt; Bob - Answer C
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
