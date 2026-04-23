"use client";

import { AnimatePresence, motion } from "framer-motion";

type VictoryOverlayProps = {
  visible: boolean;
  winnerName?: string | null;
};

export const VictoryOverlay = ({ visible, winnerName }: VictoryOverlayProps) => {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[#05040b]/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="relative overflow-hidden rounded-3xl border border-[#b28bff]/50 bg-gradient-to-b from-[#25123b]/95 to-[#090a12]/95 px-8 py-10 text-center shadow-[0_0_40px_rgba(131,110,251,0.75)]"
          >
            <motion.div
              animate={{ y: [0, 28] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute inset-0 opacity-70"
            >
              {Array.from({ length: 22 }).map((_, index) => (
                <span
                  key={`particle-${index}`}
                  className="absolute h-3 w-[2px] rounded-full bg-gradient-to-b from-white to-[#caa6ff]"
                  style={{ left: `${(index * 19) % 100}%`, top: `${(index * 11) % 80}%` }}
                />
              ))}
            </motion.div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#74d9ff]">Victory</p>
            <h2 className="mt-3 text-4xl font-black tracking-[0.16em] text-white sm:text-6xl">VICTORY</h2>
            <p className="mt-4 text-2xl font-black text-[#40ff8e] sm:text-3xl">YOU WON 2,500 MON</p>
            <p className="mt-2 text-sm text-white/75">{winnerName ?? "Kazanan bekleniyor"}</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
