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
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="rounded-3xl border border-[#15ff7a]/60 bg-black/70 px-6 py-8 text-center shadow-[0_0_44px_rgba(21,255,122,0.7)]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#3FD4FF]">Victory</p>
            <h2 className="mt-3 text-2xl font-black text-[#15ff7a] sm:text-4xl">SON ELENEN KAZANDI</h2>
            <p className="mt-3 text-lg font-semibold text-white sm:text-2xl">{winnerName ?? "Kazanan bekleniyor"}</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
