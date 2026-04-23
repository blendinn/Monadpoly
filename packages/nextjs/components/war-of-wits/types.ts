export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  hint?: string;
};

export type SabotageType = "ice" | "smoke" | "time";

export type WinnerItem = {
  id: string;
  playerName: string;
};

export type EliminationItem = {
  id: string;
  playerName: string;
  wrongAnswer: string;
};
