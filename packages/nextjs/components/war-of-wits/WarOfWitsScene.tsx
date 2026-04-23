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
import type { ChainBlockItem, EliminationItem, SabotageType } from "./types";
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
  const [pot, setPot] = useState(mockPot);
  const [potPulseKey, setPotPulseKey] = useState(0);
  const [glitchTick, setGlitchTick] = useState(0);
  const [edgeGlowTick, setEdgeGlowTick] = useState(0);
  const [sabotageEffect, setSabotageEffect] = useState<SabotageType | null>(null);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [playersRemaining, setPlayersRemaining] = useState(initialContestants);
  const [walletBalance] = useState(mockWalletBalance);
  const [sabotageSpent, setSabotageSpent] = useState(0);
  const [eliminationBurstKey, setEliminationBurstKey] = useState(0);
  const [chainBlocks, setChainBlocks] = useState<ChainBlockItem[]>([]);
  const [eliminations, setEliminations] = useState<EliminationItem[]>([]);

  const currentQuestion = useMemo(() => mockQuestions[questionIndex % mockQuestions.length], [questionIndex]);
  const totalSpent = mockEntryFee + sabotageSpent;
  const potentialEarnings = playersRemaining > 0 ? pot / playersRemaining : pot;

  const triggerEdgeGlow = () => setEdgeGlowTick(previous => previous + 1);

  const randomHash = () => Math.random().toString(16).slice(2, 7).toUpperCase();

  const handleAnswer = (isCorrect: boolean, optionLabel: string) => {
    const player = mockPlayers[Math.floor(Math.random() * mockPlayers.length)];
    if (isCorrect) {
      burstConfetti();
      setPot(previous => previous + 3.2 + Math.random() * 5.8);
      setPotPulseKey(previous => previous + 1);
      setChainBlocks(previous => {
        const prevHash = previous[0]?.hash ?? "GEN00";
        const next: ChainBlockItem = {
          id: `blk-${Date.now()}`,
          playerName: player,
          answerLabel: optionLabel,
          hash: randomHash(),
          prevHash,
        };
        return [next, ...previous].slice(0, 12);
      });
    } else {
      setGlitchTick(previous => previous + 1);
      setPlayersRemaining(previous => Math.max(1, previous - (1 + Math.floor(Math.random() * 4))));
      setEliminationBurstKey(previous => previous + 1);
      setEliminations(previous => {
        const next: EliminationItem = {
          id: `el-${Date.now()}`,
          playerName: player,
          wrongAnswer: optionLabel,
        };
        return [next, ...previous].slice(0, 14);
      });
    }
    triggerEdgeGlow();
    setTimeout(() => setQuestionIndex(previous => previous + 1), 900);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setPot(previous => previous + Math.random() * 0.5);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chainBlocks.length > 0) return;
    setChainBlocks(
      Array.from({ length: 6 }, (_, index) => ({
        id: `seed-${index}`,
        playerName: mockPlayers[index % mockPlayers.length],
        answerLabel: "Parallel execution with low latency finality",
        hash: randomHash(),
        prevHash: index === 0 ? "GEN00" : randomHash(),
      })),
    );
    setEliminations([
      { id: "seed-el-1", playerName: "Bob", wrongAnswer: "Option C" },
      { id: "seed-el-2", playerName: "Nisa", wrongAnswer: "Option D" },
      { id: "seed-el-3", playerName: "Mert", wrongAnswer: "Option B" },
    ]);
  }, [chainBlocks.length]);

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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
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
          <div className="xl:col-span-3">
            <LiveBlitzFeed blocks={chainBlocks} eliminations={eliminations} />
          </div>

          <div className="xl:col-span-6 space-y-4">
            <StickmanSpectacle
              totalPlayers={initialContestants}
              playersRemaining={playersRemaining}
              eliminationBurstKey={eliminationBurstKey}
            />
            <CombatArena
              question={currentQuestion}
              onAnswer={handleAnswer}
              onEdgeGlow={triggerEdgeGlow}
              glitchTick={glitchTick}
            />
          </div>

          <div className="xl:col-span-3 space-y-4">
            <HudSidebar
              walletBalance={walletBalance}
              totalSpent={totalSpent}
              entryFee={mockEntryFee}
              sabotageSpent={sabotageSpent}
            />
            <SabotageDeck onTrigger={handleSabotage} entryFee={mockEntryFee} />
          </div>
        </div>
      </div>
    </main>
  );
};
