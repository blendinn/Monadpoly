import type { QuizQuestion } from "./types";

export const mockPot = 250;
export const mockWalletBalance = 250;
export const mockEntryFee = 0;
export const initialContestants = 100;
export const web3Participants = [
  "0x9f7a...12c1",
  "0x41de...88b2",
  "0x77aa...0f45",
  "0xc239...9ad0",
  "0x18be...4f77",
  "0xa912...b66e",
  "0x5ce4...e130",
  "0xdd10...44c2",
  "0x3ea8...71a9",
  "0x0f92...9d0e",
  "0xbe22...ac18",
  "0x6e41...33f2",
];
export const mockQuestions: QuizQuestion[] = [
  {
    id: "q-1",
    prompt: "Which performance target makes Monad stand out?",
    options: [
      { id: "a", label: "10,000 TPS and low latency finality" },
      { id: "b", label: "Only cheap NFT minting" },
      { id: "c", label: "No smart contracts" },
      { id: "d", label: "Single validator design" },
    ],
    correctOptionId: "a",
    hint: "Focus on speed and throughput.",
  },
  {
    id: "q-2",
    prompt: "What advantage does EVM compatibility give to a team?",
    options: [
      { id: "a", label: "No frontend development is needed" },
      { id: "b", label: "Existing Solidity knowledge can be reused" },
      { id: "c", label: "Gas is always zero" },
      { id: "d", label: "It only works on mobile" },
    ],
    correctOptionId: "b",
    hint: "Think about existing tools.",
  },
  {
    id: "q-3",
    prompt: "What is the most critical UX element in a Web3 quiz game?",
    options: [
      { id: "a", label: "Long waiting screens" },
      { id: "b", label: "Instant feedback and clear state" },
      { id: "c", label: "Text-only flow" },
      { id: "d", label: "Random button placement" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-4",
    prompt: "Which one matches the definition of self-custody?",
    options: [
      { id: "a", label: "The user controls the private key" },
      { id: "b", label: "A centralized exchange holds all funds" },
      { id: "c", label: "The team lead stores your password" },
      { id: "d", label: "Login with only email" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q-5",
    prompt: "What is the best description of optimistic UI behavior?",
    options: [
      { id: "a", label: "Show nothing until confirmation" },
      { id: "b", label: "Reflect user action immediately" },
      { id: "c", label: "Clear all state" },
      { id: "d", label: "Disable animations" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-6",
    prompt: "What is a blockchain explorer mainly used for?",
    options: [
      { id: "a", label: "Generate wallet passwords" },
      { id: "b", label: "Verify on-chain transactions" },
      { id: "c", label: "Burn tokens automatically" },
      { id: "d", label: "Deploy without an RPC node" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-7",
    prompt: "What does a fixed reward pool provide in a Game-Fi economy?",
    options: [
      { id: "a", label: "Predictable reward distribution" },
      { id: "b", label: "Random reward increase every second" },
      { id: "c", label: "Infinite inflation" },
      { id: "d", label: "Earnings independent of player count" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q-8",
    prompt: "What is the purpose of the elimination round?",
    options: [
      { id: "a", label: "Only changing colors" },
      { id: "b", label: "Removing players with wrong answers" },
      { id: "c", label: "Extending the timer" },
      { id: "d", label: "Resetting score" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-9",
    prompt: "Which formula calculates earnings per player?",
    options: [
      { id: "a", label: "Total Pot / Remaining Players" },
      { id: "b", label: "Total Pot * Remaining Players" },
      { id: "c", label: "Total Pot - Remaining Players" },
      { id: "d", label: "Fixed 1 MON" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q-10",
    prompt: "Which is a professional game loop approach?",
    options: [
      { id: "a", label: "Lobby -> Playing -> Elimination -> GameOver" },
      { id: "b", label: "Mixing all states on one screen" },
      { id: "c", label: "Switching states without a timer" },
      { id: "d", label: "Ending rounds without a winner" },
    ],
    correctOptionId: "a",
  },
];

export const mockPlayers = [
  "Aylin",
  "Bora",
  "Cem",
  "Dora",
  "Efe",
  "Lara",
  "Mert",
  "Nisa",
  "Ozan",
  "Pelin",
  "Rana",
  "Sarp",
  "Tuna",
  "Yaren",
];
