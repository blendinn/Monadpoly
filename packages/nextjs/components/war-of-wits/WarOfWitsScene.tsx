"use client";

import { useEffect, useMemo, useState } from "react";
import { CombatArena } from "./CombatArena";
import { LiveBlitzFeed } from "./LiveBlitzFeed";
import { VictoryOverlay } from "./VictoryOverlay";
import { mockQuestions } from "./mockData";
import type { EliminationItem, WinnerItem } from "./types";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

type GameState = "MENU" | "PLAYING" | "ELIMINATED" | "FINISHED";

const PLAY_SECONDS = 12;

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
  const { address, isConnected } = useAccount();
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [stateTimer, setStateTimer] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [glitchTick, setGlitchTick] = useState(0);
  const [edgeGlowTick, setEdgeGlowTick] = useState(0);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [eliminations, setEliminations] = useState<EliminationItem[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<{ optionId: string; optionLabel: string } | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const hasQuestions = mockQuestions.length > 0;
  const participant = isConnected && address ? address.toLowerCase() : null;
  const isJoined = participant ? participants.includes(participant) : false;

  const currentQuestion = useMemo(
    () => (hasQuestions ? mockQuestions[questionIndex % mockQuestions.length] : null),
    [hasQuestions, questionIndex],
  );

  const triggerEdgeGlow = () => setEdgeGlowTick(previous => previous + 1);

  const handleStartFromMenu = () => {
    if (!hasQuestions || !participant || !isJoined) return;
    setQuestionIndex(0);
    setEliminations([]);
    setWinners([]);
    setVictoryVisible(false);
    setResultMessage("");
    setSelectedAnswer(null);
    setGameState("PLAYING");
    setStateTimer(PLAY_SECONDS);
  };

  const startFinished = () => {
    if (!participant) return;
    setResultMessage("Tum sorulari dogru cevapladin.");
    setGameState("FINISHED");
    setStateTimer(0);
    setVictoryVisible(true);
    victoryConfetti();
    setWinners([{ id: `champion-${Date.now()}`, playerName: participant }]);
  };

  const eliminatePlayer = (wrongAnswer: string) => {
    if (!participant) return;
    setEliminations(previous => [
      {
        id: `el-${Date.now()}`,
        playerName: participant,
        wrongAnswer,
      },
      ...previous,
    ]);
    setResultMessage("Yanlis cevap verdin. Elendin.");
    setGameState("ELIMINATED");
    setStateTimer(0);
    setGlitchTick(previous => previous + 1);
    triggerEdgeGlow();
  };

  const resolveAnswer = (optionId: string, optionLabel: string) => {
    if (!currentQuestion) return;
    const isCorrect = optionId === currentQuestion.correctOptionId;

    if (!isCorrect) {
      eliminatePlayer(optionLabel);
      return;
    }

    burstConfetti();
    setResultMessage("Dogru cevap.");
    if (participant) {
      setWinners(previous => [{ id: `ok-${Date.now()}`, playerName: participant }, ...previous].slice(0, 32));
    }
    triggerEdgeGlow();
    const isLastQuestion = questionIndex >= mockQuestions.length - 1;
    if (isLastQuestion) {
      startFinished();
    } else {
      setQuestionIndex(previous => previous + 1);
      setSelectedAnswer(null);
      setStateTimer(PLAY_SECONDS);
    }
  };

  const handleAnswerSelection = (optionId: string, optionLabel: string) => {
    if (gameState !== "PLAYING" || selectedAnswer) return;
    setSelectedAnswer({ optionId, optionLabel });
    resolveAnswer(optionId, optionLabel);
  };

  useEffect(() => {
    setWinners([]);
  }, []);

  const refreshParticipants = async () => {
    const response = await fetch("/api/contest/participants", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { participants?: string[] };
    setParticipants(data.participants ?? []);
  };

  const joinCompetition = async () => {
    if (!participant) return;
    setIsJoining(true);
    try {
      const response = await fetch("/api/contest/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: participant }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { participants?: string[] };
      setParticipants(data.participants ?? []);
      setResultMessage("Yarismaya katildin.");
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    void refreshParticipants();
    const interval = setInterval(() => {
      void refreshParticipants();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const timer = setInterval(() => {
      setStateTimer(previous => Math.max(0, previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === "PLAYING" && stateTimer === 0) {
      eliminatePlayer("Sure doldu");
    }
  }, [gameState, stateTimer, currentQuestion]);

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

      <VictoryOverlay visible={victoryVisible || gameState === "FINISHED"} winnerName={participant} />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#3FD4FF] sm:text-sm">Monad Yarisma Modu</p>
          <p className="text-xs font-semibold text-[#15ff7a]">Yarismaci: {participant ?? "Bagli degil"}</p>
        </div>

        {gameState === "MENU" ? (
          <div className="rounded-2xl border border-[#836EFB]/45 bg-[#836EFB]/10 p-4">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#bfb3ff]">Main Menu</p>
            <p className="mt-2 text-center text-sm text-white/80">Cuzdanini bagla, yarismaya katil ve sonra baslat.</p>
            {participant ? <p className="mt-3 text-center text-xs text-[#6dffab] font-mono">{participant}</p> : null}
            <div className="mt-3">
              <p className="text-center text-xs uppercase tracking-[0.15em] text-cyan-200">Katilimcilar</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {participants.length > 0 ? (
                  participants.map(item => (
                    <p
                      key={item}
                      className="rounded-lg border border-[#15ff7a]/30 bg-[#15ff7a]/10 px-2 py-1 text-xs font-mono"
                    >
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-center text-xs text-white/70 sm:col-span-2">Henuz katilimci yok.</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={joinCompetition}
                disabled={!participant || isJoined || isJoining}
                className="btn btn-sm border border-cyan-300/60 bg-cyan-300/15 font-bold text-cyan-200 hover:bg-cyan-300/25"
              >
                {isJoined ? "Katildin" : isJoining ? "Ekleniyor..." : "Yarismaya Katil"}
              </button>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleStartFromMenu}
                disabled={!hasQuestions || !participant || !isJoined}
                className="btn border border-[#15ff7a]/60 bg-[#15ff7a]/15 font-bold text-[#15ff7a] hover:bg-[#15ff7a]/30"
              >
                Bastan Basla
              </button>
            </div>
            {!hasQuestions || !participant || !isJoined ? (
              <p className="mt-3 text-center text-xs text-[#ff8baa]">
                Baslatmak icin soru listesi, bagli cuzdan ve katilim gerekli.
              </p>
            ) : null}
          </div>
        ) : null}
        {gameState === "PLAYING" ? (
          <div className="rounded-2xl border border-cyan-300/40 bg-cyan-400/10 px-4 py-3 text-center text-sm font-semibold text-cyan-200">
            Soru suresi devam ediyor ({stateTimer}s)
          </div>
        ) : null}
        {gameState === "ELIMINATED" ? (
          <div className="rounded-2xl border border-[#ff315f]/45 bg-[#ff315f]/10 px-4 py-3 text-center text-sm font-semibold text-[#ff8baa]">
            Elendin. Yanlis cevap verdin.
            <div className="mt-3">
              <button
                onClick={() => setGameState("MENU")}
                className="btn btn-sm border border-[#ff315f]/60 bg-[#ff315f]/15 font-bold text-[#ff9cb4] hover:bg-[#ff315f]/25"
              >
                Ana Menuye Don
              </button>
            </div>
          </div>
        ) : null}
        {gameState === "FINISHED" ? (
          <div className="rounded-2xl border border-[#15ff7a]/45 bg-[#15ff7a]/10 px-4 py-3 text-center text-sm font-semibold text-[#86ffc0]">
            Yarisma bitti. Tebrikler.
          </div>
        ) : null}
        {resultMessage ? (
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-center text-sm text-white/90">
            {resultMessage}
          </div>
        ) : null}
        {gameState === "PLAYING" && currentQuestion ? (
          <CombatArena
            question={currentQuestion}
            phaseLabel="Soru"
            timeLeft={stateTimer}
            selectedOptionId={selectedAnswer?.optionId ?? null}
            isInteractive
            onSelectAnswer={handleAnswerSelection}
            onEdgeGlow={triggerEdgeGlow}
            glitchTick={glitchTick}
          />
        ) : null}

        <LiveBlitzFeed winners={winners} eliminations={eliminations} />
      </div>
    </main>
  );
};
