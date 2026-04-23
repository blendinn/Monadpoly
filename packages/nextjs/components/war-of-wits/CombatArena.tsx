"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuizQuestion } from "./types";
import { motion } from "framer-motion";

type CombatArenaProps = {
  question: QuizQuestion;
  phaseLabel: string;
  timeLeft: number;
  selectedOptionId: string | null;
  isInteractive: boolean;
  onSelectAnswer: (optionId: string, optionLabel: string) => void;
  onEdgeGlow: () => void;
  glitchTick: number;
};

export const CombatArena = ({
  question,
  phaseLabel,
  timeLeft,
  selectedOptionId,
  isInteractive,
  onSelectAnswer,
  onEdgeGlow,
  glitchTick,
}: CombatArenaProps) => {
  const [optimisticSuccess, setOptimisticSuccess] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticSuccess(null);
  }, [question.id]);

  const progress = useMemo(() => (Math.max(0, timeLeft) / 10) * 100, [timeLeft]);

  const handleOptionClick = (optionId: string, optionLabel: string) => {
    if (!isInteractive || selectedOptionId) return;
    onEdgeGlow();
    setOptimisticSuccess(optionId);
    onSelectAnswer(optionId, optionLabel);
  };

  return (
    <motion.section
      key={glitchTick}
      initial={{ x: 0 }}
      animate={{ x: [0, -12, 10, -8, 8, 0] }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/20 bg-[#1b1d27]/70 p-5 backdrop-blur-md shadow-[0_0_24px_rgba(131,110,251,0.28)] sm:p-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(131,110,251,0.2),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(63,212,255,0.12),transparent_45%)]" />
      <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/70">
        <span>{phaseLabel}</span>
        <span>{Math.max(0, timeLeft)} sec</span>
      </div>

      <div className="relative h-4 overflow-hidden rounded-full border border-[#ff315f]/50 bg-black/60 shadow-[0_0_24px_rgba(255,49,95,0.35)]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#ff2b4d] via-[#ff5d1f] to-[#ffb21f] shadow-[0_0_28px_rgba(255,64,64,0.9)]"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 30 }}
        />
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-[11px] font-bold uppercase tracking-[0.2em] text-white">
          10 sec
        </p>
      </div>

      <h2 className="mt-6 text-lg font-black text-white sm:text-2xl">{question.prompt}</h2>
      {question.hint ? <p className="mt-2 text-xs text-white/55">Backend note: {question.hint}</p> : null}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isActive = selectedOptionId === option.id;
          const showGreen = optimisticSuccess === option.id || selectedOptionId === option.id;
          const optionLetter = String.fromCharCode(65 + index);
          const buttonClass = showGreen
            ? "border-[#15ff7a] bg-[#15ff7a]/15 text-[#7dffb4] shadow-[0_0_25px_rgba(21,255,122,0.8)]"
            : isActive
              ? "border-[#ff315f] bg-[#ff315f]/15 text-[#ffd1dc] shadow-[0_0_18px_rgba(255,49,95,0.7)]"
              : "border-[#5f4fb9]/50 bg-[#11131a] text-white hover:border-[#836EFB] hover:shadow-[0_0_20px_rgba(131,110,251,0.7)]";

          return (
            <motion.button
              key={option.id}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 1.13, y: -4 }}
              animate={isActive ? { scale: [1, 1.1, 1.02] } : undefined}
              transition={{ duration: 0.32 }}
              disabled={!isInteractive || !!selectedOptionId}
              onClick={() => handleOptionClick(option.id, option.label)}
              className={`rounded-xl border px-4 py-4 text-left text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
            >
              <span className="mr-2 font-black text-[#9c88ff]">{optionLetter}</span>
              {showGreen ? "Correct (Test Mode) " : ""}
              {option.label}
            </motion.button>
          );
        })}
      </div>

      {optimisticSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 inline-flex items-center rounded-full border border-[#15ff7a]/50 bg-[#15ff7a]/10 px-4 py-1 text-xs font-bold tracking-wider text-[#15ff7a]"
        >
          OPTIMISTIC HIT CONFIRMED
        </motion.div>
      ) : null}
    </motion.section>
  );
};
