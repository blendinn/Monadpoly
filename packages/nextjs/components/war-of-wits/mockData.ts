import monadQuestions from "../../../../monad_questions.json";
import type { QuizQuestion } from "./types";

export const mockPot = 250;
export const mockWalletBalance = 250;
export const mockEntryFee = 0.25;
export const initialContestants = 100;

type RawQuestion = {
  id: number;
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  answer: string;
  hint?: string;
};

const orderedQuestions = [...(monadQuestions as RawQuestion[])].sort((left, right) => left.id - right.id);

// Questions are rendered from easy to hard via ascending id.
export const mockQuestions: QuizQuestion[] = orderedQuestions.map(item => ({
  id: `q-${item.id}`,
  prompt: item.question,
  options: [
    { id: "a", label: item.a },
    { id: "b", label: item.b },
    { id: "c", label: item.c },
    { id: "d", label: item.d },
  ],
  correctOptionId: item.answer.toLowerCase(),
  hint: item.hint,
}));

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
