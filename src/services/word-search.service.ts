export type GameDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface WordPlacement {
  word: string
  displayWord: string
  row: number
  col: number
  dr: number
  dc: number
}

export interface WordSearchConfigInput {
  words: string[]
  difficulty: GameDifficulty
  allowDiagonal?: boolean
  allowBackwards?: boolean
  timeLimitSeconds?: number | null
  gridSize?: number
}

export interface WordSearchConfig extends WordSearchConfigInput {
  grid: string[][]
  placements: WordPlacement[]
  gridSize: number
}

const DIFFICULTY_PRESETS: Record<
  GameDifficulty,
  { gridSize: number; allowDiagonal: boolean; allowBackwards: boolean }
> = {
  EASY: { gridSize: 8, allowDiagonal: false, allowBackwards: false },
  MEDIUM: { gridSize: 10, allowDiagonal: true, allowBackwards: false },
  HARD: { gridSize: 12, allowDiagonal: true, allowBackwards: true },
}

export const GRID_SIZE_BY_DIFFICULTY: Record<GameDifficulty, number> = {
  EASY: DIFFICULTY_PRESETS.EASY.gridSize,
  MEDIUM: DIFFICULTY_PRESETS.MEDIUM.gridSize,
  HARD: DIFFICULTY_PRESETS.HARD.gridSize,
}

export function getDifficultyPreset(difficulty: GameDifficulty) {
  return DIFFICULTY_PRESETS[difficulty]
}

/** Usa gridSize explícito (6–16) ou o padrão da dificuldade. */
export function resolveGridSize(difficulty: GameDifficulty, explicitGridSize?: number | null): number {
  if (
    explicitGridSize != null &&
    Number.isInteger(explicitGridSize) &&
    explicitGridSize >= 6 &&
    explicitGridSize <= 16
  ) {
    return explicitGridSize
  }
  return DIFFICULTY_PRESETS[difficulty].gridSize
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
}

export function validateWords(words: string[]): { valid: boolean; error?: string; normalized: string[] } {
  if (words.length < 2) {
    return { valid: false, error: 'Informe pelo menos 2 palavras', normalized: [] }
  }
  if (words.length > 15) {
    return { valid: false, error: 'Máximo de 15 palavras', normalized: [] }
  }

  const normalized: string[] = []
  const seen = new Set<string>()

  for (const raw of words) {
    const word = normalizeWord(raw)
    if (word.length < 3) {
      return { valid: false, error: `Palavra muito curta: "${raw}"`, normalized: [] }
    }
    if (word.length > 12) {
      return { valid: false, error: `Palavra muito longa: "${raw}"`, normalized: [] }
    }
    if (seen.has(word)) {
      return { valid: false, error: `Palavra duplicada: "${word}"`, normalized: [] }
    }
    seen.add(word)
    normalized.push(word)
  }

  return { valid: true, normalized }
}

function getDirections(allowDiagonal: boolean, allowBackwards: boolean): { dr: number; dc: number }[] {
  const dirs: { dr: number; dc: number }[] = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
  ]
  if (allowDiagonal) {
    dirs.push({ dr: 1, dc: 1 }, { dr: 1, dc: -1 })
  }
  if (allowBackwards) {
    dirs.push(
      { dr: 0, dc: -1 },
      { dr: -1, dc: 0 },
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
    )
    if (allowDiagonal) {
      dirs.push({ dr: 1, dc: -1 }, { dr: -1, dc: 1 })
    }
  }
  return dirs
}

function isDiagonalDirection(dr: number, dc: number): boolean {
  return dr !== 0 && dc !== 0
}

/** Limite de palavras em diagonal conforme quantidade total. */
export function maxDiagonalPlacements(wordCount: number): number {
  if (wordCount <= 5) return 1
  if (wordCount <= 10) return 2
  return 3
}

function orderDirectionsPreferStraight(
  directions: { dr: number; dc: number }[],
): { dr: number; dc: number }[] {
  const straight = directions.filter((d) => !isDiagonalDirection(d.dr, d.dc))
  const diagonal = directions.filter((d) => isDiagonalDirection(d.dr, d.dc))
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)
  return [...shuffle(straight), ...shuffle(diagonal)]
}

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dr: number,
  dc: number,
): boolean {
  const size = grid.length
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    if (r < 0 || r >= size || c < 0 || c >= size) return false
    const cell = grid[r][c]
    if (cell !== '' && cell !== word[i]) return false
  }
  return true
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dr: number,
  dc: number,
): void {
  for (let i = 0; i < word.length; i++) {
    grid[row + dr * i][col + dc * i] = word[i]
  }
}

function fillEmpty(grid: string[][]): void {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid.length; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)]
      }
    }
  }
}

export function generateWordSearch(input: WordSearchConfigInput): WordSearchConfig {
  const validation = validateWords(input.words)
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Palavras inválidas')
  }

  const preset = DIFFICULTY_PRESETS[input.difficulty]
  const allowDiagonal = input.allowDiagonal ?? preset.allowDiagonal
  const allowBackwards = input.allowBackwards ?? preset.allowBackwards
  const gridSize = resolveGridSize(input.difficulty, input.gridSize)
  const sortedWords = [...validation.normalized].sort((a, b) => b.length - a.length)

  const maxWordLen = Math.max(...validation.normalized.map((w) => w.length))
  if (maxWordLen > gridSize) {
    throw new Error(
      `A maior palavra tem ${maxWordLen} letras e não cabe numa grade ${gridSize}×${gridSize}. Aumente a grade ou encurte as palavras.`,
    )
  }

  const maxAttempts = 200
  const maxDiagonal = allowDiagonal ? maxDiagonalPlacements(sortedWords.length) : 0

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: string[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => ''),
    )
    const placements: WordPlacement[] = []
    let diagonalCount = 0
    let success = true

    for (const word of sortedWords) {
      let placed = false
      const mayUseDiagonal = allowDiagonal && diagonalCount < maxDiagonal
      const availableDirs = getDirections(mayUseDiagonal, allowBackwards)
      const orderedDirs = orderDirectionsPreferStraight(availableDirs)

      for (let tryCount = 0; tryCount < 100 && !placed; tryCount++) {
        const { dr, dc } = orderedDirs[tryCount % orderedDirs.length]
        const row = Math.floor(Math.random() * gridSize)
        const col = Math.floor(Math.random() * gridSize)

        if (canPlace(grid, word, row, col, dr, dc)) {
          placeWord(grid, word, row, col, dr, dc)
          placements.push({
            word,
            displayWord: word,
            row,
            col,
            dr,
            dc,
          })
          if (isDiagonalDirection(dr, dc)) {
            diagonalCount++
          }
          placed = true
        }
      }

      if (!placed) {
        success = false
        break
      }
    }

    if (success) {
      fillEmpty(grid)
      return {
        words: validation.normalized,
        difficulty: input.difficulty,
        allowDiagonal,
        allowBackwards,
        timeLimitSeconds: input.timeLimitSeconds ?? null,
        gridSize,
        grid,
        placements,
      }
    }
  }

  throw new Error(
    'Não foi possível gerar a grade. Tente menos palavras, palavras mais curtas ou dificuldade menor.',
  )
}

export function buildConfigFromInput(input: WordSearchConfigInput): WordSearchConfig {
  return generateWordSearch(input)
}
