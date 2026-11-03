export type AnswerFormat = 'number' | 'yesno';

export interface CardTemplate {
  id: string;
  generator: string;
  params: Record<string, string | number>;
  answerFormat: AnswerFormat;
  /** Four clue levels: nudge, name the trick, first step, show me. {vars} are filled from the problem. */
  clues: [string, string, string, string];
}

export interface Trick {
  id: string;
  name: string;
  rule: string;
  example: string;
  why: string;
  workbookSection: string;
  unlockOrder: number;
  /** Units this trick is tuned for. Empty or missing = general facts only. */
  units?: number[];
  templates: CardTemplate[];
}

export interface Problem {
  prompt: string;
  answer: string;
  vars: Record<string, string | number>;
}

export interface CardState {
  templateId: string;
  box: number; // 1..5
  nextDue: number; // epoch ms
  lastSeen: number;
  attempts: number;
  box1Returns: number;
}

export interface Attempt {
  templateId: string;
  timestamp: number;
  answer: string;
  correct: boolean;
  msToAnswer: number;
  clueLevel: number;
  cardType: CardType;
}

export type CardType = 'use' | 'mixed';

export interface Session {
  id: string;
  date: string;
  startedAt: number;
  endedAt?: number;
  cardsSeen: number;
}

export interface Settings {
  startedOn: number;
  introducedTricks: string[];
  manuallyUnlocked: string[];
  currentUnit?: number;
  factsMode?: 'unit' | 'general';
}
