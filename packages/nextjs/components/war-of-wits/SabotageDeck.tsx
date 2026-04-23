"use client";

import type { SabotageType } from "./types";
import { motion } from "framer-motion";

type SabotageDeckProps = {
  onTrigger: (type: SabotageType) => void;
  entryFee: number;
};

const cards: { type: SabotageType; title: string; description: string; feeMultiplier: number }[] = [
  { type: "time", title: "Sureyi Kisalt", description: "-3s All Rivals", feeMultiplier: 3 },
  { type: "smoke", title: "Goruntu Blurla", description: "Rivals for 3s", feeMultiplier: 3 },
  { type: "ice", title: "Sure Tablosunu Gizle", description: "Rivals end-of-round", feeMultiplier: 5 },
];

export const SabotageDeck = ({ onTrigger, entryFee }: SabotageDeckProps) => {
  return (
    <aside className="rounded-3xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#3FD4FF]">Sabotage Your Rivals</h3>

      <div className="mt-4 space-y-3">
        {cards.map(card => (
          <motion.button
            key={card.type}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onTrigger(card.type)}
            className="w-full rounded-2xl border border-[#ff315f]/45 bg-black/35 p-4 text-left transition-all hover:shadow-[0_0_18px_rgba(255,49,95,0.8)]"
          >
            <p className="text-sm font-semibold text-[#ff6f8f]">{card.title}</p>
            <p className="mt-1 text-xs text-white/70">{card.description}</p>
            <p className="mt-1 text-xs font-semibold text-[#ffd57f]">
              Ucret: {(entryFee * card.feeMultiplier).toFixed(2)} MON
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300/80">
              Backend&apos;e istek atilacak
            </p>
          </motion.button>
        ))}
      </div>
    </aside>
  );
};
