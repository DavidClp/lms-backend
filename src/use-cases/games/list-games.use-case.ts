import { IGameRepository, GameData, GameWithProgress } from '../../repositories/interfaces/IGameRepository'
import { AppError } from '../../middlewares/error.middleware'
import {
  sanitizeHangmanConfigForPlayer,
  isHangmanConfig,
  type HangmanConfig,
} from '../../services/hangman.service'
import type { GameConfig } from '../../repositories/interfaces/IGameRepository'

function sanitizeGameForPlayer(game: GameData): GameData {
  if (game.type === 'HANGMAN' && isHangmanConfig(game.config)) {
    return {
      ...game,
      config: sanitizeHangmanConfigForPlayer(game.config as HangmanConfig) as GameConfig,
    }
  }
  return game
}

export class ListGamesUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(userId: string, isAdmin: boolean): Promise<GameWithProgress[] | GameData[]> {
    if (isAdmin) {
      return this.gameRepository.findAll(true)
    }
    const games = await this.gameRepository.findAllWithUserProgress(userId, false)
    return games.map((g) => sanitizeGameForPlayer(g) as GameWithProgress)
  }
}

export class GetGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(id: string, userId: string, isAdmin: boolean) {
    const game = await this.gameRepository.findById(id)
    if (!game) throw new AppError('Jogo não encontrado', 404)
    if (!game.isActive && !isAdmin) throw new AppError('Jogo não disponível', 404)

    const progress = await this.gameRepository.findProgress(userId, id)
    const safeGame = isAdmin ? game : sanitizeGameForPlayer(game)

    return {
      ...safeGame,
      userProgress: progress,
    }
  }
}
