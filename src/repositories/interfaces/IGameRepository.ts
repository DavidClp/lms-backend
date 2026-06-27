import type { WordSearchConfig } from '../../services/word-search.service'
import type { HangmanConfig } from '../../services/hangman.service'

export type GameType = 'WORD_SEARCH' | 'HANGMAN'
export type GameDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type GameConfig = WordSearchConfig | HangmanConfig

export interface GameData {
  id: string
  title: string
  description: string | null
  type: GameType
  difficulty: GameDifficulty
  config: GameConfig
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface GameWithProgress extends GameData {
  userProgress?: {
    completed: boolean
    completedAt: Date | null
    stats: Record<string, unknown> | null
  } | null
}

export interface CreateGameDTO {
  title: string
  description?: string | null
  type?: GameType
  difficulty: GameDifficulty
  config: GameConfig
  isActive?: boolean
  order?: number
}

export interface UpdateGameDTO {
  title?: string
  description?: string | null
  difficulty?: GameDifficulty
  config?: GameConfig
  isActive?: boolean
  order?: number
}

export interface GameProgressData {
  id: string
  userId: string
  gameId: string
  completed: boolean
  completedAt: Date | null
  stats: Record<string, unknown> | null
}

export interface IGameRepository {
  findAll(includeInactive?: boolean): Promise<GameData[]>
  findById(id: string): Promise<GameData | null>
  create(data: CreateGameDTO): Promise<GameData>
  update(id: string, data: UpdateGameDTO): Promise<GameData>
  delete(id: string): Promise<void>
  findProgress(userId: string, gameId: string): Promise<GameProgressData | null>
  upsertProgress(
    userId: string,
    gameId: string,
    data: { completed: boolean; stats?: Record<string, unknown> },
  ): Promise<GameProgressData>
  findAllWithUserProgress(userId: string, includeInactive?: boolean): Promise<GameWithProgress[]>
}
