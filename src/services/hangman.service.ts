import type { GameDifficulty } from './word-search.service'
import { normalizeWord } from './word-search.service'

export interface HangmanConfigInput {
  secretWord: string
  hint: string
  category?: string | null
  difficulty: GameDifficulty
  maxWrongGuesses?: number | null
}

export interface HangmanConfig {
  secretWord: string
  displayWord: string
  hint: string
  category?: string | null
  difficulty: GameDifficulty
  maxWrongGuesses: number
  wordLength: number
}

const MAX_WRONG_BY_DIFFICULTY: Record<GameDifficulty, number> = {
  EASY: 8,
  MEDIUM: 6,
  HARD: 4,
}

export function resolveMaxWrongGuesses(
  difficulty: GameDifficulty,
  explicit?: number | null,
): number {
  if (
    explicit != null &&
    Number.isInteger(explicit) &&
    explicit >= 3 &&
    explicit <= 12
  ) {
    return explicit
  }
  return MAX_WRONG_BY_DIFFICULTY[difficulty]
}

export function buildHangmanConfig(input: HangmanConfigInput): HangmanConfig {
  const raw = input.secretWord.trim()
  if (raw.length < 3) {
    throw new Error('A palavra deve ter pelo menos 3 caracteres')
  }
  if (raw.length > 20) {
    throw new Error('A palavra deve ter no máximo 20 caracteres')
  }

  const secretWord = normalizeWord(raw)
  if (secretWord.length < 3) {
    throw new Error('A palavra deve conter letras válidas (A–Z)')
  }

  const hint = input.hint.trim()
  if (hint.length < 3) {
    throw new Error('A dica deve ter pelo menos 3 caracteres')
  }

  const maxWrongGuesses = resolveMaxWrongGuesses(input.difficulty, input.maxWrongGuesses)

  return {
    secretWord,
    displayWord: raw,
    hint,
    category: input.category?.trim() || null,
    difficulty: input.difficulty,
    maxWrongGuesses,
    wordLength: secretWord.length,
  }
}

/** Remove a palavra secreta para alunos. */
export function sanitizeHangmanConfigForPlayer(
  config: HangmanConfig,
): Omit<HangmanConfig, 'secretWord' | 'displayWord'> & { wordLength: number } {
  const { secretWord: _s, displayWord: _d, ...rest } = config
  return {
    ...rest,
    wordLength: config.wordLength,
  }
}

export function isHangmanConfig(config: unknown): config is HangmanConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'secretWord' in config &&
    'hint' in config &&
    'maxWrongGuesses' in config
  )
}
