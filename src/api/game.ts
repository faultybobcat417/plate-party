export const GAME_TYPES = [
  "tic-tac-toe",
  "memory",
  "word-guess",
  "questions",
  "rps",
  "quick-math",
] as const;

export type GameType = (typeof GAME_TYPES)[number];

export function isGameType(value: string): value is GameType {
  return GAME_TYPES.includes(value as GameType);
}

export type GameScore = {
  gameType: GameType;
  score: number;
  highScore: number;
  platesEarned: number;
  playedAt: string;
};

export type GameResult = {
  won: boolean;
  score: number;
  platesEarned: number;
};

const HIGH_SCORES: Record<GameType, number> = {
  "tic-tac-toe": 0,
  memory: 0,
  "word-guess": 0,
  questions: 0,
  rps: 0,
  "quick-math": 0,
};

const PLATE_BASE_RATES: Record<GameType, number> = {
  "tic-tac-toe": 10,
  memory: 5,
  "word-guess": 15,
  questions: 20,
  rps: 5,
  "quick-math": 2,
};

export function calculatePlates(gameType: GameType, score: number, won: boolean): number {
  if (!won) return 0;
  const base = PLATE_BASE_RATES[gameType];
  if (!base || score <= 0) return 0;
  return base * score;
}

export function saveGameResult(gameType: GameType, result: GameResult): GameScore {
  const now = new Date().toISOString();
  const highScore = Math.max(result.score, HIGH_SCORES[gameType] ?? 0);
  HIGH_SCORES[gameType] = highScore;

  return {
    gameType,
    score: result.score,
    highScore,
    platesEarned: result.platesEarned,
    playedAt: now,
  };
}

export function getHighScore(gameType: GameType): number {
  return HIGH_SCORES[gameType] ?? 0;
}

export function getAllHighScores(): Record<GameType, number> {
  return { ...HIGH_SCORES };
}

export function setHighScores(scores: Partial<Record<GameType, number>>): void {
  for (const type of GAME_TYPES) {
    HIGH_SCORES[type] = scores[type] ?? 0;
  }
}
