"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { LiveBlitzFeed } from "./LiveBlitzFeed";
import { VictoryOverlay } from "./VictoryOverlay";
import { mockQuestions } from "./mockData";
import type { EliminationItem, WinnerItem } from "./types";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

type GamePhase = "LOBBY" | "PLAYING" | "ELIMINATED" | "FINISHED";

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
  const [walletBalance, setWalletBalance] = useState(250);
  const [statusMessage, setStatusMessage] = useState("Connect wallet and join the lobby.");
  const [winners] = useState<WinnerItem[]>([]);
  const [eliminations] = useState<EliminationItem[]>([]);

  const currentQuestion = useMemo(
    () => mockQuestions[Math.min(store.currentQuestionIndex, mockQuestions.length - 1)],
    [store.currentQuestionIndex],
  );

  const isReady = playerAddress ? readyParticipants.includes(playerAddress) : false;
  const alivePlayers = participants.length;
  const potentialEarnings = alivePlayers > 0 ? store.pot / alivePlayers : store.pot;
  const winnerCandidate = playerAddress && participants.length === 1 && participants[0] === playerAddress;

  const syncParticipants = async () => {
    const response = await fetch("/api/contest/participants", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { participants?: string[] };
    setParticipants(data.participants ?? []);
  };

  const syncReadyState = async () => {
    const response = await fetch("/api/contest/state", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { readyParticipants?: string[]; started?: boolean };
    const nextReady = Array.isArray(data.readyParticipants) ? data.readyParticipants : [];
    setReadyParticipants(nextReady);
    if (data.started && store.phase === "LOBBY" && store.hasJoined && !store.isEliminated && participants.length > 1) {
      dispatch({ type: "START_PLAYING", timer: QUESTION_SECONDS });
      setStatusMessage("Match started. Good luck.");
    }
  };

  const updateStartedState = async (started: boolean) => {
    await fetch("/api/contest/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ started, startedAt: started ? Date.now() : null }),
    });
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
    if (!playerAddress || !store.hasJoined || store.phase !== "LOBBY") return;
    await fetch("/api/contest/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readyAddress: playerAddress, isReady: !isReady }),
    });
    await syncReadyState();
  };

  const manualStart = async () => {
    if (!store.hasJoined) return;
    if (participants.length <= 1) {
      setStatusMessage("At least 2 players required.");
      return;
    }
    const waiting = participants.find(item => !readyParticipants.includes(item));
    if (waiting) {
      setStatusMessage(`Hazir vermesi bekleniyor: ${waiting}`);
      return;
    }
    await updateStartedState(true);
    dispatch({ type: "START_PLAYING", timer: QUESTION_SECONDS });
    setStatusMessage("All ready. Match started.");
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
    if (store.phase !== "PLAYING" || store.selectedOptionId) return;
    dispatch({ type: "SELECT_OPTION", optionId });
  };

  const sabotage = (label: string) => {
    const spectator = !store.hasJoined || store.phase === "ELIMINATED";
    if (!spectator) {
      setStatusMessage("Only eliminated players or spectators can sabotage.");
      return;
    }
    dispatch({ type: "ADD_TO_POT", amount: SABOTAGE_FEE });
    setWalletBalance(previous => Math.max(0, previous - SABOTAGE_FEE));
    setStatusMessage(`${label} activated. Pool increased.`);
  };

  const claimReward = () => {
    if (store.phase !== "FINISHED" || store.rewardClaimed || !winnerCandidate) return;
    setWalletBalance(previous => previous + store.pot);
    dispatch({ type: "CLAIMED" });
    setStatusMessage(`Reward claimed: ${store.pot.toFixed(2)} MON`);
  };

  useEffect(() => {
    void syncParticipants();
    void syncReadyState();
    const interval = setInterval(() => {
      void syncParticipants();
      void syncReadyState();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (store.phase !== "PLAYING") return;
    const t = setInterval(() => dispatch({ type: "SET_TIMER", timer: Math.max(0, store.timer - 1) }), 1000);
    return () => clearInterval(t);
  }, [store.phase, store.timer]);

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
            <p className="text-sm text-white/80">Join, get ready, and start manually when everyone is ready.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={joinGame} disabled={!playerAddress || store.hasJoined} className="btn btn-sm btn-info">
                {store.hasJoined ? "Joined" : "Join (1 MON)"}
              </button>
              <button onClick={toggleReady} disabled={!store.hasJoined} className="btn btn-sm btn-warning">
                {isReady ? "Unready" : "Ready"}
              </button>
              <button onClick={manualStart} disabled={!store.hasJoined} className="btn btn-sm btn-success">
                Start Match
              </button>
            </div>
            <p className="text-xs text-white/70">
              Ready: {readyParticipants.length}/{participants.length}
            </p>
            {participants.length <= 1 ? <p className="text-xs text-rose-300">1 kişi varsa yarışma başlamaz.</p> : null}
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
            <p className="text-sm text-cyan-200">Timer: {store.timer}s</p>
            <h2 className="text-xl font-black text-white">{currentQuestion?.prompt}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion?.options.map(option => (
                <button
                  key={option.id}
                  onClick={() => onSelectAnswer(option.id)}
                  disabled={!!store.selectedOptionId}
                  className="rounded-xl border border-violet-400/40 bg-[#151823] px-3 py-3 text-left text-sm text-white transition hover:shadow-[0_0_16px_rgba(131,110,251,0.7)] disabled:opacity-60"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );
      case "ELIMINATED":
        return (
          <div className="space-y-4 rounded-2xl border border-rose-400/35 bg-black/55 p-5">
            <p className="text-2xl font-black tracking-[0.2em] text-rose-300">ELENDINIZ</p>
            <p className="text-sm text-white/70">Spectator mode active. You can use sabotage buttons.</p>
          </div>
        );
      case "FINISHED":
        return (
          <div className="space-y-4 rounded-2xl border border-emerald-400/35 bg-black/50 p-5">
            <p className="text-3xl font-black tracking-[0.2em] text-emerald-300">VICTORY</p>
            <p className="text-sm text-white/70">Auto reset in {FINISHED_SECONDS} seconds.</p>
            <button
              onClick={claimReward}
              disabled={!winnerCandidate || store.rewardClaimed}
              className="btn btn-sm btn-success"
            >
              {store.rewardClaimed ? "Reward Claimed" : "Claim Reward"}
            </button>
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
            <p className="mt-2 text-xl font-bold">{participants.length}</p>
          </div>
        </div>

        {renderPhase()}

        <div className="rounded-2xl border border-white/15 bg-[#1e1e24]/65 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Sabotage Deck</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button onClick={() => sabotage("SHORTEN TIMER")} className="btn btn-sm btn-error">
              1) Shorten Timer
            </button>
            <button onClick={() => sabotage("BLUR VIEW")} className="btn btn-sm btn-error">
              2) Blur View
            </button>
            <button onClick={() => sabotage("HIDE TIMER")} className="btn btn-sm btn-error">
              3) Hide Timer
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
