export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

export type SabotageType = "ice" | "smoke" | "time";

export type ChainBlockItem = {
  id: string;
  playerName: string;
  answerLabel: string;
  hash: string;
  prevHash: string;
};

export type EliminationItem = {
  id: string;
  playerName: string;
  wrongAnswer: string;
};
