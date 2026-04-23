"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { LiveBlitzFeed } from "./LiveBlitzFeed";
import { VictoryOverlay } from "./VictoryOverlay";
import { mockQuestions } from "./mockData";
import type { EliminationItem, WinnerItem } from "./types";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type GamePhase = "LOBBY" | "PLAYING" | "ELIMINATED" | "FINISHED";
type ContestSyncState = {
  started: boolean;
  startedAt: number | null;
  readyParticipants: string[];
  countdownStartedAt: number | null;
  countdownSeconds: number;
};
type SabotageType = "freeze" | "shorten" | "hide";
type SabotageEvent = {
  id: number;
  type: SabotageType;
  from: string;
  amount: number;
  createdAt: number;
};

type GameStore = {
  phase: GamePhase;
  timer: number;
  currentQuestionIndex: number;
  pot: number;
  selectedOptionId: string | null;
  hasAnsweredCurrent: boolean;
  isEliminated: boolean;
  hasJoined: boolean;
  rewardClaimed: boolean;
  finishedAt: number | null;
};

type GameAction =
  | { type: "JOIN"; entryFee: number }
  | { type: "START_PLAYING"; timer: number }
  | { type: "SET_TIMER"; timer: number }
  | { type: "SELECT_OPTION"; optionId: string }
  | { type: "NEXT_QUESTION"; timer: number }
  | { type: "ELIMINATE" }
  | { type: "ADD_TO_POT"; amount: number }
  | { type: "SHORTEN_TIMER"; seconds: number }
  | { type: "FINISH"; at: number }
  | { type: "CLAIMED" }
  | { type: "RESET" };

const QUESTION_SECONDS = 10;
const TOTAL_QUESTIONS = 10;
const FINISHED_SECONDS = 30;
const ENTRY_FEE = 1;
const SABOTAGE_FEE = 0.5;

const initialState: GameStore = {
  phase: "LOBBY",
  timer: QUESTION_SECONDS,
  currentQuestionIndex: 0,
  pot: 0,
  selectedOptionId: null,
  hasAnsweredCurrent: false,
  isEliminated: false,
  hasJoined: false,
  rewardClaimed: false,
  finishedAt: null,
};

const reducer = (state: GameStore, action: GameAction): GameStore => {
  switch (action.type) {
    case "JOIN":
      return { ...state, hasJoined: true, pot: state.pot + action.entryFee };
    case "START_PLAYING":
      return {
        ...state,
        phase: "PLAYING",
        timer: action.timer,
        currentQuestionIndex: 0,
        selectedOptionId: null,
        hasAnsweredCurrent: false,
        rewardClaimed: false,
        isEliminated: false,
        finishedAt: null,
      };
    case "SET_TIMER":
      return { ...state, timer: action.timer };
    case "SELECT_OPTION":
      return { ...state, selectedOptionId: action.optionId, hasAnsweredCurrent: true };
    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        timer: action.timer,
        selectedOptionId: null,
        hasAnsweredCurrent: false,
      };
    case "ELIMINATE":
      return { ...state, phase: "ELIMINATED", isEliminated: true, timer: 0 };
    case "ADD_TO_POT":
      return { ...state, pot: state.pot + action.amount };
    case "SHORTEN_TIMER":
      return { ...state, timer: Math.max(0, state.timer - action.seconds) };
    case "FINISH":
      return { ...state, phase: "FINISHED", finishedAt: action.at, timer: 0 };
    case "CLAIMED":
      return { ...state, rewardClaimed: true };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

export const WarOfWitsScene = () => {
  const { address, isConnected } = useAccount();
  const playerAddress = isConnected && address ? address.toLowerCase() : null;
  const [store, dispatch] = useReducer(reducer, initialState);
  const [participants, setParticipants] = useState<string[]>([]);
  const [readyParticipants, setReadyParticipants] = useState<string[]>([]);
  const [contestSync, setContestSync] = useState<ContestSyncState>({
    started: false,
    startedAt: null,
    readyParticipants: [],
    countdownStartedAt: null,
    countdownSeconds: 5,
  });
  const [walletBalance, setWalletBalance] = useState(250);
  const [statusMessage, setStatusMessage] = useState("Connect wallet and join the lobby.");
  const [winners] = useState<WinnerItem[]>([]);
  const [eliminations] = useState<EliminationItem[]>([]);
  const [freezeUntil, setFreezeUntil] = useState(0);
  const [hideTimerUntil, setHideTimerUntil] = useState(0);
  const [lastProcessedSabotageId, setLastProcessedSabotageId] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const [lastSabotageQuestionIndex, setLastSabotageQuestionIndex] = useState(-1);
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [optimisticReady, setOptimisticReady] = useState<boolean | null>(null);
  const [stablePlayerCount, setStablePlayerCount] = useState(0);
  const [readyVisualState, setReadyVisualState] = useState<"idle" | "pending" | "joined">("idle");

  const { data: onchainPotPulse } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "totalPot",
    watch: true,
  });
  const {
    writeContractAsync: writeReadyTx,
    isPending: isReadyPending,
    isMining: isReadyMining,
  } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  const currentQuestion = useMemo(
    () => mockQuestions[Math.min(store.currentQuestionIndex, mockQuestions.length - 1)],
    [store.currentQuestionIndex],
  );

  const serverReady = playerAddress ? readyParticipants.includes(playerAddress) : false;
  const isReady = optimisticReady ?? serverReady;
  const isReadyBusy = isTogglingReady || isReadyPending || isReadyMining;
  const isFrozen = nowMs < freezeUntil;
  const isTimerHidden = nowMs < hideTimerUntil;
  const sabotageOnCooldown = store.phase === "PLAYING" && lastSabotageQuestionIndex === store.currentQuestionIndex;
  const alivePlayers = participants.length;
  const potentialEarnings = alivePlayers > 0 ? store.pot / alivePlayers : store.pot;
  const winnerCandidate = playerAddress && participants.length === 1 && participants[0] === playerAddress;
  const countdownLeft = contestSync.countdownStartedAt
    ? Math.max(0, contestSync.countdownSeconds - Math.floor((Date.now() - contestSync.countdownStartedAt) / 1000))
    : null;

  const syncParticipants = async () => {
    const response = await fetch("/api/contest/participants", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { participants?: string[] };
    setParticipants(data.participants ?? []);
  };

  const syncReadyState = async () => {
    const response = await fetch("/api/contest/state", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<ContestSyncState>;
    const nextReady = Array.isArray(data.readyParticipants) ? data.readyParticipants : [];
    const normalized: ContestSyncState = {
      started: Boolean(data.started),
      startedAt: typeof data.startedAt === "number" ? data.startedAt : null,
      readyParticipants: nextReady,
      countdownStartedAt: typeof data.countdownStartedAt === "number" ? data.countdownStartedAt : null,
      countdownSeconds: typeof data.countdownSeconds === "number" ? data.countdownSeconds : 5,
    };
    setContestSync(normalized);
    setReadyParticipants(nextReady);
    if (playerAddress) {
      setOptimisticReady(nextReady.includes(playerAddress));
    } else {
      setOptimisticReady(null);
    }
    if (
      normalized.started &&
      store.phase === "LOBBY" &&
      store.hasJoined &&
      !store.isEliminated &&
      participants.length > 1
    ) {
      dispatch({ type: "START_PLAYING", timer: QUESTION_SECONDS });
      setStatusMessage("Match started. Good luck.");
    }
    return normalized;
  };

  const syncSabotageEvents = async () => {
    const response = await fetch("/api/contest/sabotage", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { events?: SabotageEvent[] };
    const events = Array.isArray(data.events) ? data.events : [];
    if (events.length === 0) return;

    let latest = lastProcessedSabotageId;
    for (const event of events) {
      if (event.id <= lastProcessedSabotageId) continue;
      latest = Math.max(latest, event.id);
      dispatch({ type: "ADD_TO_POT", amount: event.amount });

      const isIncoming = event.from !== playerAddress;
      const canAffectMe = store.phase === "PLAYING" && !store.isEliminated && isIncoming;
      if (!canAffectMe) continue;

      if (event.type === "freeze") {
        setFreezeUntil(previous => Math.max(previous, Date.now() + 3000));
        setStatusMessage("Sabotage hit: your screen is frozen for 3s.");
      } else if (event.type === "shorten") {
        dispatch({ type: "SHORTEN_TIMER", seconds: 3 });
        setStatusMessage("Sabotage hit: your timer was shortened by 3s.");
      } else if (event.type === "hide") {
        setHideTimerUntil(previous => Math.max(previous, Date.now() + 5000));
        setStatusMessage("Sabotage hit: your timer is hidden for 5s.");
      }
    }
    if (latest !== lastProcessedSabotageId) {
      setLastProcessedSabotageId(latest);
    }
  };

  const updateStartedState = async (started: boolean) => {
    await fetch("/api/contest/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ started, startedAt: started ? Date.now() : null }),
    });
    if (!started) {
      await fetch("/api/contest/sabotage", { method: "DELETE" });
      setLastProcessedSabotageId(0);
      setFreezeUntil(0);
      setHideTimerUntil(0);
    }
  };

  const joinGame = async () => {
    if (!playerAddress || store.hasJoined) return;
    await fetch("/api/contest/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: playerAddress }),
    });
    dispatch({ type: "JOIN", entryFee: ENTRY_FEE });
    setWalletBalance(previous => Math.max(0, previous - ENTRY_FEE));
    setStatusMessage("Joined. Payed 1 MON entry fee.");
    await syncParticipants();
  };

  const toggleReady = async () => {
    if (!playerAddress || !store.hasJoined || store.phase !== "LOBBY" || isReadyBusy) return;
    const nextReady = !isReady;
    setIsTogglingReady(true);
    setOptimisticReady(nextReady);
    try {
      setReadyVisualState("pending");
      await writeReadyTx({
        functionName: "addToPot",
        value: parseEther("0"),
      });
      const response = await fetch("/api/contest/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readyAddress: playerAddress, isReady: nextReady }),
      });
      if (!response.ok) {
        setOptimisticReady(serverReady);
        setReadyVisualState(serverReady ? "joined" : "idle");
        setStatusMessage("Ready update failed. Please try again.");
        notification.error("Ready update failed. Please try again.");
        return;
      }
      await syncReadyState();
      setReadyVisualState(nextReady ? "joined" : "idle");
      setStatusMessage(nextReady ? "Ready confirmed. Waiting for others..." : "You are unready.");
      notification.success(nextReady ? "Ready confirmed." : "Set to unready.");
    } catch (error) {
      const parsedError = getParsedError(error).toLowerCase();
      const isUserRejected = parsedError.includes("user rejected") || parsedError.includes("rejected");
      const isInsufficientBalance = parsedError.includes("insufficient");
      setOptimisticReady(serverReady);
      setReadyVisualState(serverReady ? "joined" : "idle");
      if (isUserRejected) {
        setStatusMessage("Transaction rejected from wallet.");
        notification.error("Transaction rejected from wallet.");
      } else if (isInsufficientBalance) {
        setStatusMessage("Insufficient balance for transaction.");
        notification.error("Insufficient balance for transaction.");
      } else {
        setStatusMessage("Ready transaction failed.");
        notification.error(getParsedError(error));
      }
    } finally {
      setIsTogglingReady(false);
    }
  };

  const eliminateCurrentPlayer = async (reason: string) => {
    if (!playerAddress || store.isEliminated) return;
    dispatch({ type: "ELIMINATE" });
    setStatusMessage(`Eliminated: ${reason}`);
    await fetch("/api/contest/participants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: playerAddress }),
    });
    await syncParticipants();
  };

  const onSelectAnswer = (optionId: string) => {
    if (store.phase !== "PLAYING" || store.selectedOptionId || isFrozen) return;
    dispatch({ type: "SELECT_OPTION", optionId });
  };

  const sabotage = async (type: SabotageType, label: string, feeMultiplier: number) => {
    const canUse = store.hasJoined && store.phase === "PLAYING" && !store.isEliminated;
    if (!canUse) {
      setStatusMessage("Sabotage is only available for alive players during PLAYING.");
      return;
    }
    if (sabotageOnCooldown) {
      setStatusMessage("Sabotage cooldown active. You can use it once per question.");
      return;
    }
    if (!playerAddress) return;
    const spend = SABOTAGE_FEE * feeMultiplier;
    if (walletBalance < spend) {
      setStatusMessage("Not enough MON for sabotage.");
      return;
    }
    setWalletBalance(previous => Math.max(0, previous - spend));

    const response = await fetch("/api/contest/sabotage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, from: playerAddress, amount: spend }),
    });
    if (!response.ok) {
      setStatusMessage("Sabotage failed.");
      return;
    }

    setStatusMessage(`${label} activated. ${spend.toFixed(2)} MON added to reward pool.`);
    setLastSabotageQuestionIndex(store.currentQuestionIndex);
    await syncSabotageEvents();
  };

  const autoDistributeReward = () => {
    if (store.phase !== "FINISHED" || store.rewardClaimed) return;
    const survivors = Math.max(1, participants.length);
    const rewardPerWinner = store.pot / survivors;
    const isWinner = store.hasJoined && !store.isEliminated;
    if (isWinner) {
      setWalletBalance(previous => previous + rewardPerWinner);
      setStatusMessage(`VICTORY! Reward distributed: ${rewardPerWinner.toFixed(2)} MON`);
    } else {
      setStatusMessage("Game finished. Winners received the reward pool.");
    }
    dispatch({ type: "CLAIMED" });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStablePlayerCount(participants.length);
    }, 180);
    return () => clearTimeout(timeout);
  }, [participants.length, onchainPotPulse]);

  useEffect(() => {
    if (!store.hasJoined) {
      setReadyVisualState("idle");
      return;
    }
    if (isReadyBusy) {
      setReadyVisualState("pending");
      return;
    }
    setReadyVisualState(isReady ? "joined" : "idle");
  }, [store.hasJoined, isReadyBusy, isReady]);

  useEffect(() => {
    void syncParticipants();
    void syncReadyState();
    void syncSabotageEvents();
    const interval = setInterval(() => {
      void syncParticipants();
      void syncReadyState();
      void syncSabotageEvents();
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (store.phase !== "PLAYING") return;
    const t = setInterval(() => dispatch({ type: "SET_TIMER", timer: Math.max(0, store.timer - 1) }), 1000);
    return () => clearInterval(t);
  }, [store.phase, store.timer]);

  useEffect(() => {
    if (store.phase !== "PLAYING") {
      setLastSabotageQuestionIndex(-1);
    }
  }, [store.phase]);

  useEffect(() => {
    if (store.phase !== "PLAYING" || !currentQuestion) return;
    if (store.timer > 0 && !store.hasAnsweredCurrent) return;

    const selectedId = store.selectedOptionId;
    const isCorrect = selectedId === currentQuestion.correctOptionId;
    if (!isCorrect) {
      void eliminateCurrentPlayer(selectedId ? "Wrong answer" : "Timeout");
      return;
    }

    const isLastQuestion = store.currentQuestionIndex >= TOTAL_QUESTIONS - 1;
    if (isLastQuestion || winnerCandidate) {
      dispatch({ type: "FINISH", at: Date.now() });
      setStatusMessage("Game finished. Claim reward if you survived.");
      void confetti({ particleCount: 220, spread: 140, origin: { y: 0.6 } });
      return;
    }

    dispatch({ type: "NEXT_QUESTION", timer: QUESTION_SECONDS });
  }, [
    store.phase,
    store.timer,
    store.hasAnsweredCurrent,
    store.selectedOptionId,
    currentQuestion,
    winnerCandidate,
    store.currentQuestionIndex,
  ]);

  useEffect(() => {
    if (store.phase !== "FINISHED") return;
    autoDistributeReward();
    const timeout = setTimeout(() => {
      dispatch({ type: "RESET" });
      setStatusMessage("Back to lobby.");
      void updateStartedState(false);
    }, FINISHED_SECONDS * 1000);
    return () => clearTimeout(timeout);
  }, [store.phase]);

  const renderPhase = () => {
    switch (store.phase) {
      case "LOBBY":
        return (
          <div className="space-y-4 rounded-2xl border border-white/20 bg-black/30 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">Lobby</p>
            <p className="text-sm text-white/80">
              Join and press ready. Game starts for everyone after 5-second countdown.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={joinGame}
                disabled={!playerAddress || store.hasJoined}
                className="btn btn-sm border border-cyan-300/70 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 font-black uppercase tracking-[0.08em] text-cyan-100 shadow-[0_0_18px_rgba(56,189,248,0.55)] hover:from-cyan-300/40 hover:to-blue-400/40 disabled:border-white/20 disabled:bg-white/5 disabled:text-white/45 disabled:shadow-none"
              >
                {store.hasJoined ? "Joined" : "Join The Match (1 MON)"}
              </button>
              <button
                onClick={toggleReady}
                disabled={!playerAddress || !store.hasJoined || isReadyBusy}
                className={`btn btn-sm font-bold uppercase tracking-[0.08em] ${
                  readyVisualState === "joined"
                    ? "border border-sky-300/70 bg-sky-500/25 text-sky-100 hover:bg-sky-500/30"
                    : "border border-emerald-300/70 bg-emerald-400/20 text-emerald-100 hover:bg-emerald-300/25"
                } disabled:border-white/20 disabled:bg-white/5 disabled:text-white/45`}
              >
                {isReadyBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    Processing...
                  </span>
                ) : readyVisualState === "joined" ? (
                  "WAITING..."
                ) : (
                  "READY"
                )}
              </button>
            </div>
            <p className="text-xs text-white/70">
              Ready: {readyParticipants.length}/{stablePlayerCount}
            </p>
            {stablePlayerCount <= 1 ? <p className="text-xs text-rose-300">1 kişi varsa yarışma başlamaz.</p> : null}
            {countdownLeft !== null && stablePlayerCount > 1 ? (
              <p className="text-xs text-emerald-300">All ready. Starting in: {countdownLeft}</p>
            ) : null}
            {countdownLeft === null && stablePlayerCount > 1 && readyParticipants.length < stablePlayerCount ? (
              <p className="text-xs text-rose-300">
                Hazir vermesi bekleniyor: {participants.find(item => !readyParticipants.includes(item))}
              </p>
            ) : null}
          </div>
        );
      case "PLAYING":
        return (
          <div className="space-y-4 rounded-2xl border border-white/20 bg-black/30 p-5">
            <div className="h-3 overflow-hidden rounded-full border border-rose-400/60 bg-black/50">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-yellow-500"
                animate={{ width: `${(Math.max(0, store.timer) / QUESTION_SECONDS) * 100}%` }}
                transition={{ type: "tween", ease: "linear", duration: 0.25 }}
              />
            </div>
            <p className="text-sm text-cyan-200">{isTimerHidden ? "Timer: ???" : `Timer: ${store.timer}s / 10s`}</p>
            <h2 className="text-xl font-black text-white">{currentQuestion?.prompt}</h2>
            {isFrozen ? (
              <p className="rounded-md border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                You are frozen for 3 seconds by sabotage.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => onSelectAnswer(option.id)}
                  disabled={!!store.selectedOptionId || isFrozen}
                  className="rounded-xl border border-violet-400/40 bg-[#151823] px-3 py-3 text-left text-sm text-white transition hover:shadow-[0_0_16px_rgba(131,110,251,0.7)] disabled:opacity-60"
                >
                  <span className="mr-2 font-black text-cyan-300">{String.fromCharCode(65 + index)}.</span>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/65">
              Rule: Wrong answer or no answer in 10 seconds = ELIMINATED. Correct answer = next question.
            </p>
          </div>
        );
      case "ELIMINATED":
        return (
          <div className="space-y-4 rounded-2xl border border-rose-400/55 bg-rose-900/20 p-5 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            <p className="text-3xl font-black tracking-[0.2em] text-rose-300">ELIMINATED</p>
            <p className="text-sm text-white/80">You answered wrong or timed out. Entry fee is lost.</p>
            <div className="rounded-xl border border-white/15 bg-black/35 p-3 text-xs text-white/75">
              <p>Spectator Mode: You cannot answer questions anymore.</p>
              <p className="mt-1">You can still watch remaining players, reward pool and sabotage flow.</p>
            </div>
          </div>
        );
      case "FINISHED":
        return (
          <div className="space-y-4 rounded-2xl border border-emerald-400/35 bg-black/50 p-5">
            <p className="text-3xl font-black tracking-[0.2em] text-emerald-300">VICTORY</p>
            <p className="text-sm text-white/70">
              10 questions completed or one player left. Pool distributed to survivors.
            </p>
            <p className="text-sm text-emerald-200">Auto reset in {FINISHED_SECONDS} seconds.</p>
            <p className="text-xs text-white/70">
              Winners: {Math.max(1, participants.length)} | Pool: {store.pot.toFixed(2)} MON
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#07080f] px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-[#1e1e24]/65 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Wallet</p>
            <p className="mt-2 text-2xl font-black">{walletBalance.toFixed(2)} MON</p>
          </div>
          <div className="rounded-2xl border border-violet-400/35 bg-[#1e1e24]/65 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Total Reward Pool</p>
            <p className="mt-2 text-4xl font-black text-violet-300">{store.pot.toFixed(2)} MON</p>
            <p className="mt-2 text-xs text-emerald-300">Potential: {potentialEarnings.toFixed(2)} MON</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-[#1e1e24]/65 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Players</p>
            <p className="mt-2 text-xl font-bold">{stablePlayerCount}</p>
          </div>
        </div>

        {renderPhase()}

        <div className="rounded-2xl border border-white/15 bg-[#1e1e24]/65 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Sabotage Deck</p>
          <p className="mt-1 text-xs text-white/70">Alive players can buy sabotage. Cost goes to reward pool.</p>
          <p className="mt-1 text-xs text-amber-300">
            {sabotageOnCooldown ? "Cooldown: used this question." : "Cooldown: available"}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              onClick={() => void sabotage("shorten", "SHORTEN TIMER", 3)}
              disabled={sabotageOnCooldown}
              className="btn btn-sm btn-error disabled:opacity-40"
            >
              1) Shorten Timer (-3s)
            </button>
            <button
              onClick={() => void sabotage("freeze", "FREEZE SCREEN", 3)}
              disabled={sabotageOnCooldown}
              className="btn btn-sm btn-error disabled:opacity-40"
            >
              2) Freeze Screen (3s)
            </button>
            <button
              onClick={() => void sabotage("hide", "HIDE TIMER", 5)}
              disabled={sabotageOnCooldown}
              className="btn btn-sm btn-error disabled:opacity-40"
            >
              3) Hide Timer (5s)
            </button>
          </div>
        </div>

        <LiveBlitzFeed winners={winners} eliminations={eliminations} />
        <div className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/80">
          {statusMessage}
        </div>
      </div>
      <VictoryOverlay visible={store.phase === "FINISHED"} winnerName={winnerCandidate ? playerAddress : null} />
    </main>
  );
};
