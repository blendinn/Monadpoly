"use client";

import type { EliminationItem, WinnerItem } from "./types";
import { motion } from "framer-motion";

type LiveBlitzFeedProps = {
  winners: WinnerItem[];
  eliminations: EliminationItem[];
};

const WinnerCard = ({ item }: { item: WinnerItem }) => (
  <div className="min-w-[180px] rounded-xl border border-[#15ff7a]/45 bg-[#06140d] px-3 py-2 shadow-[0_0_18px_rgba(21,255,122,0.35)]">
    <p className="font-mono text-sm font-semibold text-[#6dffab]">const winner = &quot;{item.playerName}&quot;;</p>
  </div>
);

export const LiveBlitzFeed = ({ winners, eliminations }: LiveBlitzFeedProps) => {
  const safeWinners = winners ?? [];
  const safeEliminations = eliminations ?? [];
  const winnerMarquee = [...safeWinners, ...safeWinners];
  const eliminationMarquee = [...safeEliminations, ...safeEliminations];

  return (
    <section className="grid grid-cols-1 gap-3">
      <div className="rounded-3xl border border-white/15 bg-black/55 p-4 font-mono backdrop-blur-lg">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#15ff7a]">Correct Answer Stream</h3>
        <div className="mt-3 overflow-hidden">
          <motion.div
            animate={{ x: [0, -980] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            className="flex gap-3"
          >
            {winnerMarquee.map((item, index) => (
              <WinnerCard key={`${item.id}-${index}`} item={item} />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#ff315f]/30 bg-black/55 p-3">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff5d83]">Elimination Feed</h4>
        <div className="mt-2 overflow-hidden">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 17, ease: "linear", repeat: Infinity }}
            className="flex gap-2"
          >
            {eliminationMarquee.map((entry, index) => (
              <p
                key={`${entry.id}-${index}`}
                className="min-w-max rounded-md border border-[#ff315f]/30 bg-[#ff315f]/10 px-2 py-1 text-xs text-[#ff9cb4]"
              >
                {entry.playerName} {"->"} {entry.wrongAnswer}
              </p>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
