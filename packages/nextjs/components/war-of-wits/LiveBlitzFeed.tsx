"use client";

import type { ChainBlockItem, EliminationItem } from "./types";
import { motion } from "framer-motion";

type LiveBlitzFeedProps = {
  blocks: ChainBlockItem[];
  eliminations: EliminationItem[];
};

const BlockCard = ({ item }: { item: ChainBlockItem }) => (
  <div className="relative min-h-[120px] rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#091323] to-[#131030] p-3 shadow-[inset_0_0_26px_rgba(113,219,255,0.2),0_18px_26px_rgba(0,0,0,0.45)] [transform:perspective(800px)_rotateX(8deg)]">
    <p className="text-xs font-semibold tracking-wide text-cyan-200">{item.playerName}</p>
    <p className="mt-1 text-xs text-white/70">Answer: {item.answerLabel}</p>
    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffab3c]">Hash: {item.hash}</p>
    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffab3c]">
      Prev Hash: {item.prevHash}
    </p>
  </div>
);

export const LiveBlitzFeed = ({ blocks, eliminations }: LiveBlitzFeedProps) => {
  const marquee = [...blocks, ...blocks];
  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
      <div className="rounded-3xl border border-white/15 bg-black/55 p-4 font-mono backdrop-blur-lg">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#15ff7a]">True Blockchain Feed</h3>
        <div className="mt-3 h-[330px] overflow-hidden">
          <motion.div
            animate={{ y: [0, -720] }}
            transition={{ duration: 24, ease: "linear", repeat: Infinity }}
            className="space-y-3"
          >
            {marquee.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center gap-2">
                <BlockCard item={item} />
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-cyan-300/70 text-cyan-300 shadow-[0_0_10px_rgba(63,212,255,0.8)]">
                  <span className="text-xs font-bold">8</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#ff315f]/25 bg-black/55 p-3">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff5d83]">Elimination Feed</h4>
        <div className="mt-2 h-[330px] overflow-hidden">
          <motion.div
            animate={{ y: [0, -360] }}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
            className="space-y-2"
          >
            {[...eliminations, ...eliminations].map((entry, index) => (
              <p
                key={`${entry.id}-${index}`}
                className="rounded-md border border-[#ff315f]/25 bg-[#ff315f]/8 px-2 py-1 text-xs text-[#ff9cb4]"
              >
                {entry.playerName} - {entry.wrongAnswer}
              </p>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
