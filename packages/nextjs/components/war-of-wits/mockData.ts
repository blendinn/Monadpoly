import type { QuizQuestion } from "./types";

export const mockPot = 250;
export const mockWalletBalance = 250;
export const mockEntryFee = 0.25;
export const initialContestants = 100;

export const mockQuestions: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "Why does Monad stand out for realtime Game-Fi quiz loops?",
    options: [
      { id: "a", label: "Parallel execution with low latency finality" },
      { id: "b", label: "Slow UX but lower cost only" },
      { id: "c", label: "Only bridge speed improvements" },
      { id: "d", label: "No mempool and no signatures needed" },
    ],
  },
  {
    id: "q2",
    prompt: "What creates instant dopamine in a web3 elimination arena?",
    options: [
      { id: "a", label: "Fast feedback with visible chain progression" },
      { id: "b", label: "Long and static loading moments" },
      { id: "c", label: "No stakes and hidden outcomes" },
      { id: "d", label: "Monochrome and low contrast cards" },
    ],
  },
  {
    id: "q3",
    prompt: "Which feature best amplifies high-stakes competition?",
    options: [
      { id: "a", label: "Live pot growth plus countdown pressure" },
      { id: "b", label: "Minimal animation and no timer" },
      { id: "c", label: "No elimination effects" },
      { id: "d", label: "Muted interactions and low saturation" },
    ],
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
