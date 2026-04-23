"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type HyperPotCounterProps = {
  basePot: number;
  pulseKey: number;
  playersRemaining: number;
  potentialEarnings: number;
};

const formatPot = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const HyperPotCounter = ({ basePot, pulseKey, playersRemaining, potentialEarnings }: HyperPotCounterProps) => {
  const [displayPot, setDisplayPot] = useState(basePot);

  useEffect(() => {
    const interval = setInterval(() => {
      const volatility = Math.random() * 14;
      setDisplayPot(previous => previous + volatility / 40);
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setDisplayPot(current => Math.max(current, basePot));
  }, [basePot]);

  const slotDigits = useMemo(() => formatPot(displayPot), [displayPot]);

  return (
    <motion.section
      key={pulseKey}
      initial={{ boxShadow: "0 0 0px rgba(131,110,251,0.0)" }}
      animate={{
        boxShadow: ["0 0 0px rgba(131,110,251,0.0)", "0 0 60px rgba(131,110,251,0.8)", "0 0 0px rgba(131,110,251,0.0)"],
      }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 px-4 py-6 backdrop-blur-xl sm:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(131,110,251,0.32),transparent_55%)]" />
      <p className="relative text-center text-xs font-semibold tracking-[0.35em] text-white/70 sm:text-sm">
        TOTAL REWARD POOL
      </p>
      <div className="relative mt-3 text-center font-black tracking-[0.14em] text-[#836EFB] drop-shadow-[0_0_18px_rgba(131,110,251,0.9)]">
        <span className="text-4xl sm:text-6xl lg:text-7xl">{slotDigits}</span>
        <span className="ml-3 text-xl align-middle text-[#3FD4FF] sm:text-3xl">MON</span>
      </div>
      <p className="relative mt-4 text-center text-xs font-semibold tracking-[0.1em] text-[#9ce4ff] sm:text-sm">
        Players Remaining: {playersRemaining} | Your Potential Earnings: {potentialEarnings.toFixed(2)} MON
      </p>
    </motion.section>
  );
};
