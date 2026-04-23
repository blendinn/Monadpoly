"use client";

import { useEffect, useMemo, useState } from "react";
import { CombatArena } from "./CombatArena";
import { HudSidebar } from "./HudSidebar";
import { HyperPotCounter } from "./HyperPotCounter";
import { LiveBlitzFeed } from "./LiveBlitzFeed";
import { SabotageDeck } from "./SabotageDeck";
import { StickmanSpectacle } from "./StickmanSpectacle";
import { VictoryOverlay } from "./VictoryOverlay";
import { initialContestants, mockEntryFee, mockPlayers, mockPot, mockQuestions, mockWalletBalance } from "./mockData";
import type { EliminationItem, SabotageType, WinnerItem } from "./types";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

const burstConfetti = () => {
  void confetti({ particleCount: 150, spread: 86, origin: { y: 0.62 } });
};

const victoryConfetti = () => {
  const defaults = { ticks: 220, gravity: 0.75, decay: 0.94, startVelocity: 32 };
  void confetti({ ...defaults, particleCount: 180, spread: 180, origin: { x: 0.5, y: 0.6 } });
  void confetti({ ...defaults, particleCount: 120, angle: 60, spread: 90, origin: { x: 0.03, y: 0.5 } });
  void confetti({ ...defaults, particleCount: 120, angle: 120, spread: 90, origin: { x: 0.97, y: 0.5 } });
};

export const WarOfWitsScene = () => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [pot] = useState(mockPot);
  const [potPulseKey, setPotPulseKey] = useState(0);
  const [glitchTick, setGlitchTick] = useState(0);
  const [edgeGlowTick, setEdgeGlowTick] = useState(0);
  const [sabotageEffect, setSabotageEffect] = useState<SabotageType | null>(null);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [playersRemaining, setPlayersRemaining] = useState(initialContestants);
  const [walletBalance] = useState(mockWalletBalance);
  const [sabotageSpent, setSabotageSpent] = useState(0);
  const [eliminationBurstKey, setEliminationBurstKey] = useState(0);
  const [aliveContestants, setAliveContestants] = useState<string[]>([]);
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [eliminations, setEliminations] = useState<EliminationItem[]>([]);

  const currentQuestion = useMemo(() => mockQuestions[questionIndex % mockQuestions.length], [questionIndex]);
  const totalSpent = mockEntryFee + sabotageSpent;
  const potentialEarnings = playersRemaining > 0 ? pot / playersRemaining : pot;

  const triggerEdgeGlow = () => setEdgeGlowTick(previous => previous + 1);

  const shuffle = (list: string[]) => [...list].sort(() => Math.random() - 0.5);

  const resolveRound = (isCorrect: boolean, chosenOptionLabel: string) => {
    if (aliveContestants.length <= 1) return;
    const pool = shuffle(aliveContestants);
    const difficultyRatio = Math.min(0.62, 0.2 + questionIndex * 0.012);
    const failRatio = isCorrect ? difficultyRatio : Math.min(0.75, difficultyRatio + 0.16);
    const eliminateCount = Math.min(pool.length - 1, Math.max(1, Math.round(pool.length * failRatio)));
    const eliminated = pool.slice(0, eliminateCount);
    const survived = pool.slice(eliminateCount);
    const wrongOptions = currentQuestion.options
      .filter(option => option.id !== currentQuestion.correctOptionId)
      .map(option => option.label);

    setAliveContestants(survived);
    setPlayersRemaining(survived.length);
    setPotPulseKey(previous => previous + 1);
    if (eliminated.length > 0) {
      setEliminationBurstKey(previous => previous + 1);
    }

    setWinners(previous => {
      const nextItems: WinnerItem[] = survived.slice(0, 10).map((name, index) => ({
        id: `win-${Date.now()}-${index}`,
        playerName: name,
      }));
      return [...nextItems, ...previous].slice(0, 32);
    });

    setEliminations(previous => {
      const nextItems: EliminationItem[] = eliminated.slice(0, 10).map((name, index) => ({
        id: `el-${Date.now()}-${index}`,
        playerName: name,
        wrongAnswer: isCorrect ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)] : chosenOptionLabel,
      }));
      return [...nextItems, ...previous].slice(0, 32);
    });

    if (isCorrect) {
      burstConfetti();
    } else {
      setGlitchTick(previous => previous + 1);
    }

    if (survived.length <= 1) {
      victoryConfetti();
      setVictoryVisible(true);
      setTimeout(() => setVictoryVisible(false), 2600);
    }

    triggerEdgeGlow();
    setTimeout(() => setQuestionIndex(previous => previous + 1), 1000);
  };

  const handleTimeUp = () => {
    resolveRound(false, "Time Out");
  };

  const handleSabotage = (type: SabotageType) => {
    setSabotageEffect(type);
    const multiplier = type === "ice" ? 5 : 3;
    setSabotageSpent(previous => previous + mockEntryFee * multiplier);
    triggerEdgeGlow();
    setTimeout(() => setSabotageEffect(null), 1500);
  };

  const handleSimulateWin = () => {
    triggerEdgeGlow();
    victoryConfetti();
    setVictoryVisible(true);
    setTimeout(() => setVictoryVisible(false), 2600);
  };

  const handleAnswer = (isCorrect: boolean, optionLabel: string) => {
    resolveRound(isCorrect, optionLabel);
  };

  useEffect(() => {
    if (aliveContestants.length > 0) return;
    const seededContestants = Array.from({ length: initialContestants }, (_, index) => {
      const name = mockPlayers[index % mockPlayers.length];
      return `${name}_${String(index + 1).padStart(2, "0")}`;
    });
    setAliveContestants(seededContestants);
    setPlayersRemaining(seededContestants.length);
    setWinners(
      seededContestants.slice(0, 8).map((name, index) => ({
        id: `seed-win-${index}`,
        playerName: name,
      })),
    );
  }, [aliveContestants.length]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#000000] px-3 py-5 text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(131,110,251,0.26),transparent_36%),radial-gradient(circle_at_100%_60%,rgba(63,212,255,0.2),transparent_40%)]" />
      <motion.div
        key={edgeGlowTick}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 z-40 rounded-[20px] border-2 border-[#836EFB]/80 shadow-[inset_0_0_70px_rgba(131,110,251,0.6),0_0_55px_rgba(63,212,255,0.6)]"
      />

      {sabotageEffect ? (
        <div
          className={`pointer-events-none fixed inset-0 z-30 transition-all duration-200 ${
            sabotageEffect === "smoke"
              ? "backdrop-blur-md bg-white/7"
              : sabotageEffect === "ice"
                ? "bg-cyan-200/10 backdrop-saturate-0"
                : "bg-[#ff315f]/8"
          }`}
        />
      ) : null}

      <VictoryOverlay visible={victoryVisible} wonAmount={pot} />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#3FD4FF] sm:text-sm">
            The War of Wits - Monad Blitz Kayseri
          </p>
          <button
            onClick={handleSimulateWin}
            className="btn btn-sm border border-[#15ff7a]/60 bg-[#15ff7a]/15 font-bold text-[#15ff7a] hover:bg-[#15ff7a]/30"
          >
            Simulate Win
          </button>
        </div>

        <HyperPotCounter
          basePot={pot}
          pulseKey={potPulseKey}
          playersRemaining={playersRemaining}
          potentialEarnings={potentialEarnings}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8 space-y-4">
            <StickmanSpectacle
              totalPlayers={initialContestants}
              playersRemaining={playersRemaining}
              eliminationBurstKey={eliminationBurstKey}
            />
            <CombatArena
              question={currentQuestion}
              onAnswer={handleAnswer}
              onTimeUp={handleTimeUp}
              onEdgeGlow={triggerEdgeGlow}
              glitchTick={glitchTick}
            />
          </div>

          <div className="xl:col-span-4 space-y-4">
            <HudSidebar
              walletBalance={walletBalance}
              totalSpent={totalSpent}
              entryFee={mockEntryFee}
              sabotageSpent={sabotageSpent}
            />
            <SabotageDeck onTrigger={handleSabotage} entryFee={mockEntryFee} />
          </div>
        </div>

        <LiveBlitzFeed winners={winners} eliminations={eliminations} />
      </div>
    </main>
  );
};
