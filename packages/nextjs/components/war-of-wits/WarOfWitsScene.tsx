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
type ContestStatePayload = {
  started: boolean;
  startedAt: number | null;
  readyParticipants?: string[];
};

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
  const [contestStarted, setContestStarted] = useState(false);
  const [readyParticipants, setReadyParticipants] = useState<string[]>([]);
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [walletBalance, setWalletBalance] = useState(250);
  const [sabotageSpent, setSabotageSpent] = useState(0);
  const hasQuestions = mockQuestions.length > 0;
  const participant = isConnected && address ? address.toLowerCase() : null;
  const isJoined = participant ? participants.includes(participant) : false;

  const currentQuestion = useMemo(
    () => (hasQuestions ? mockQuestions[questionIndex % mockQuestions.length] : null),
    [hasQuestions, questionIndex],
  );
  const initialDeposit = 1;
  const entryFee = 1;
  const sabotagePoints = sabotageSpent;
  const rewardPool = participants.length * entryFee;
  const playersRemaining = Math.max(0, participants.length);
  const potentialEarnings = playersRemaining > 0 ? rewardPool / playersRemaining : 0;
  const stickmanCount = Math.min(50, Math.max(10, playersRemaining));
  const isReady = participant ? readyParticipants.includes(participant) : false;

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

  const refreshContestState = async () => {
    const response = await fetch("/api/contest/state", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as ContestStatePayload;
    setContestStarted(Boolean(data.started));
    setReadyParticipants(data.readyParticipants ?? []);
  };

  const toggleReady = async () => {
    if (!hasQuestions || !participant || !isJoined) return;
    setIsTogglingReady(true);
    try {
      const response = await fetch("/api/contest/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readyAddress: participant, isReady: !isReady }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as ContestStatePayload;
      setContestStarted(Boolean(data.started));
      setReadyParticipants(data.readyParticipants ?? []);
    } finally {
      setIsTogglingReady(false);
    }
  };

  const startFinished = (wonAmount: number) => {
    if (!participant) return;
    setResultMessage(`You are the last survivor. You won ${wonAmount.toFixed(2)} MON.`);
    setGameState("FINISHED");
    setStateTimer(0);
    setVictoryVisible(true);
    victoryConfetti();
    setWalletBalance(previous => previous + wonAmount);
    setWinners([{ id: `champion-${Date.now()}`, playerName: participant }]);
  };

  const eliminatePlayer = async (wrongAnswer: string) => {
    if (!participant) return;
    setEliminations(previous => [
      {
        id: `el-${Date.now()}`,
        playerName: participant,
        wrongAnswer,
      },
      ...previous,
    ]);
    setResultMessage("Wrong answer. You are eliminated.");
    setGameState("ELIMINATED");
    setStateTimer(0);
    setGlitchTick(previous => previous + 1);
    triggerEdgeGlow();
    try {
      const response = await fetch("/api/contest/participants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: participant }),
      });
      if (response.ok) {
        const data = (await response.json()) as { participants?: string[] };
        setParticipants(data.participants ?? []);
      }
    } catch {
      // keep local elimination state even if API call fails
    }
  };

  const resolveAnswer = async (optionId: string, optionLabel: string) => {
    if (!currentQuestion) return;
    const isCorrect = optionId === currentQuestion.correctOptionId;

    if (!isCorrect) {
      await eliminatePlayer(optionLabel);
      return;
    }

    burstConfetti();
    setResultMessage("Correct answer. Keep going.");
    if (participant) {
      setWinners(previous => [{ id: `ok-${Date.now()}`, playerName: participant }, ...previous].slice(0, 32));
    }
    triggerEdgeGlow();
    const latestParticipants = await fetch("/api/contest/participants", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) return participants;
        const data = (await response.json()) as { participants?: string[] };
        return data.participants ?? participants;
      })
      .catch(() => participants);

    setParticipants(latestParticipants);
    const isLastSurvivor = participant
      ? latestParticipants.length === 1 && latestParticipants[0] === participant
      : false;
    if (isLastSurvivor) {
      startFinished(rewardPool);
    } else {
      setQuestionIndex(previous => previous + 1);
      setSelectedAnswer(null);
      setStateTimer(PLAY_SECONDS);
    }
  };

  const handleAnswerSelection = (optionId: string, optionLabel: string) => {
    if (gameState !== "PLAYING" || selectedAnswer) return;
    setSelectedAnswer({ optionId, optionLabel });
    void resolveAnswer(optionId, optionLabel);
  };

  const handleSabotageAction = (multiplier: number, label: string) => {
    const spent = entryFee * multiplier;
    setSabotageSpent(previous => previous + spent);
    setResultMessage(`${label} activated. Spent ${spent.toFixed(2)} MON.`);
    triggerEdgeGlow();
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
      setResultMessage("You joined the contest.");
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    void refreshParticipants();
    void refreshContestState();
    const interval = setInterval(() => {
      void refreshParticipants();
      void refreshContestState();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (contestStarted && gameState === "MENU" && hasQuestions && participant && isJoined) {
      handleStartFromMenu();
    }
  }, [contestStarted, gameState, hasQuestions, participant, isJoined]);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const timer = setInterval(() => {
      setStateTimer(previous => Math.max(1, previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-3 py-5 font-sans text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(131,110,251,0.28),transparent_38%),radial-gradient(circle_at_90%_35%,rgba(63,212,255,0.15),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(22,26,48,0.9),#07080f_65%)]" />
      <motion.div
        key={edgeGlowTick}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 z-40 rounded-[20px] border-2 border-[#836EFB]/80 shadow-[inset_0_0_70px_rgba(131,110,251,0.6),0_0_55px_rgba(63,212,255,0.6)]"
      />

      <VictoryOverlay visible={victoryVisible || gameState === "FINISHED"} winnerName={participant} />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_2fr_1fr]">
          <div className="rounded-2xl border border-white/15 bg-[#1e1e24]/65 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.25em] text-[#3FD4FF]">The War of Wits - Monad Blitz Kayseri</p>
            <p className="mt-3 text-xs text-white/70">Yarismaci: {participant ?? "Bagli degil"}</p>
          </div>
          <div className="rounded-2xl border border-[#836EFB]/35 bg-[#1e1e24]/65 p-5 text-center shadow-[0_0_30px_rgba(131,110,251,0.25)] backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Total Reward Pool</p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.05em] text-[#836EFB] [text-shadow:0_0_22px_rgba(131,110,251,0.85)] sm:text-5xl">
              {rewardPool.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
              <span className="text-[#3FD4FF]">MON</span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.12em]">
              <p className="text-white">Players Remaining: {playersRemaining}</p>
              <p className="text-[#2dff87] [text-shadow:0_0_10px_rgba(45,255,135,0.8)]">
                Your Potential Earnings: {potentialEarnings.toFixed(2)} MON
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#3FD4FF]/45 bg-[#1e1e24]/70 p-4 shadow-[0_0_24px_rgba(63,212,255,0.22)] backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Wallet Balance</p>
              <p className="mt-1 text-2xl font-black text-white">
                {walletBalance.toFixed(2)} <span className="text-[#3FD4FF]">MON</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-[#1e1e24]/70 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Spent MON (In-Game)</p>
              <p className="mt-1 text-xs text-white/70">
                Initial Deposit: {initialDeposit.toFixed(2)} MON + Sabotage Points: {sabotagePoints.toFixed(2)} MON
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[2.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/15 bg-[#1e1e24]/68 p-4 backdrop-blur-md">
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: stickmanCount }).map((_, index) => (
                  <motion.div
                    key={`stickman-${index}`}
                    animate={{ opacity: [0.65, 1, 0.65], y: [0, -2, 0] }}
                    transition={{ duration: 2.4 + (index % 5) * 0.2, repeat: Infinity }}
                    className="flex h-8 items-center justify-center rounded-md border border-white/10 bg-white/5"
                  >
                    <span className="text-sm text-white/85">🙂</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {(gameState === "MENU" || gameState === "ELIMINATED" || gameState === "FINISHED") && (
              <div className="rounded-2xl border border-[#836EFB]/45 bg-[#836EFB]/10 p-4">
                <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#bfb3ff]">
                  Main Menu
                </p>
                <p className="mt-2 text-center text-sm text-white/80">
                  Join the game, then press Ready. Game starts when all are ready.
                </p>
                {participant ? (
                  <p className="mt-3 text-center text-xs text-[#6dffab] font-mono">{participant}</p>
                ) : null}
                <div className="mt-3">
                  <p className="text-center text-xs uppercase tracking-[0.15em] text-cyan-200">Participants</p>
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
                      <p className="text-center text-xs text-white/70 sm:col-span-2">No participants yet.</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={joinCompetition}
                    disabled={!participant || isJoined || isJoining}
                    className="btn btn-sm border border-cyan-300/60 bg-cyan-300/15 font-bold text-cyan-200 hover:bg-cyan-300/25"
                  >
                    {isJoined ? "Joined" : isJoining ? "Joining..." : "Join Competition"}
                  </button>
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={toggleReady}
                    disabled={!hasQuestions || !participant || !isJoined || contestStarted || isTogglingReady}
                    className="btn border border-[#15ff7a]/60 bg-[#15ff7a]/15 font-bold text-[#15ff7a] hover:bg-[#15ff7a]/30"
                  >
                    {contestStarted ? "Game Started" : isTogglingReady ? "Updating..." : isReady ? "Unready" : "Ready"}
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-cyan-200">
                  Ready: {readyParticipants.length}/{participants.length}
                </p>
                {!hasQuestions || !participant || !isJoined ? (
                  <p className="mt-3 text-center text-xs text-[#ff8baa]">
                    Questions, wallet connection and participation are required.
                  </p>
                ) : null}
              </div>
            )}

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
          </div>

          <aside className="rounded-2xl border border-white/15 bg-[#1e1e24]/68 p-4 backdrop-blur-md">
            <h3 className="text-sm font-black uppercase tracking-[0.22em] text-[#3FD4FF]">Sabotage Your Rivals</h3>
            <p className="mt-1 text-xs text-white/60">Use active sabotage actions during the game.</p>
            <div className="mt-4 space-y-3">
              {[
                { id: "1", title: "SUREYI KISALT (-3s All rivals)", fee: "3x FEE" },
                { id: "2", title: "GORUNTU BLURLA (rival 3s)", fee: "3x FEE" },
                { id: "3", title: "SURE TABLOSUNU GIZLE (rivals end-of-round)", fee: "5x FEE" },
              ].map(card => (
                <button
                  key={card.id}
                  onClick={() => handleSabotageAction(card.fee === "5x FEE" ? 5 : 3, card.title)}
                  className="w-full rounded-xl border border-[#ff315f]/35 bg-[#15111a] px-3 py-3 text-left transition-all hover:border-[#ff315f]/80 hover:shadow-[0_0_18px_rgba(255,49,95,0.55)]"
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-black text-[#ff436b]">{card.id}</span>
                    <p className="flex-1 text-xs font-semibold text-white/85">{card.title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">{card.fee}</span>
                  </div>
                </button>
              ))}
            </div>
            {gameState === "ELIMINATED" ? (
              <div className="mt-4 rounded-xl border border-[#ff315f]/45 bg-[#ff315f]/10 p-3 text-center text-sm font-semibold text-[#ff8baa]">
                You are eliminated. Wrong answer.
                <div className="mt-3">
                  <button
                    onClick={() => setGameState("MENU")}
                    className="btn btn-sm border border-[#ff315f]/60 bg-[#ff315f]/15 font-bold text-[#ff9cb4] hover:bg-[#ff315f]/25"
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            ) : null}
            {gameState === "FINISHED" ? (
              <div className="mt-4 rounded-xl border border-[#15ff7a]/45 bg-[#15ff7a]/10 p-3 text-center text-sm font-semibold text-[#86ffc0]">
                Game over. Winner got the full pool.
              </div>
            ) : null}
            {resultMessage ? (
              <div className="mt-4 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center text-sm text-white/90">
                {resultMessage}
              </div>
            ) : null}
            {gameState === "PLAYING" ? (
              <div className="mt-4 rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-4 py-3 text-center text-sm font-semibold text-cyan-200">
                Question timer ({stateTimer}s)
              </div>
            ) : null}
            <div className="mt-4 grid gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Participants</p>
              {participants.slice(0, 6).map(item => (
                <p
                  key={`side-${item}`}
                  className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 font-mono text-xs text-white/80"
                >
                  {item}
                </p>
              ))}
            </div>
          </aside>
        </div>

        <LiveBlitzFeed winners={winners} eliminations={eliminations} />
      </div>
    </main>
  );
};
