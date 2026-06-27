import { z } from 'zod'
import { IGameRepository } from '../../repositories/interfaces/IGameRepository'
import { AppError } from '../../middlewares/error.middleware'
import { isHangmanConfig, type HangmanConfig } from '../../services/hangman.service'

const completeSchema = z.object({
  timeMs: z.number().int().min(0).optional(),
  foundCount: z.number().int().min(0).optional(),
  wrongGuesses: z.number().int().min(0).optional(),
  won: z.boolean().optional(),
})

export class CompleteGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(userId: string, gameId: string, input: unknown) {
    const game = await this.gameRepository.findById(gameId)
    if (!game) throw new AppError('Jogo não encontrado', 404)
    if (!game.isActive) throw new AppError('Jogo não disponível', 404)

    const parsed = completeSchema.safeParse(input ?? {})
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    if (game.type === 'HANGMAN') {
      if (!parsed.data.won) {
        throw new AppError('Só é possível concluir após vencer a forca', 400)
      }
    }

    const existing = await this.gameRepository.findProgress(userId, gameId)
    const wasAlreadyCompleted = existing?.completed ?? false

    const stats =
      game.type === 'HANGMAN' && isHangmanConfig(game.config)
        ? {
            timeMs: parsed.data.timeMs ?? null,
            wrongGuesses: parsed.data.wrongGuesses ?? 0,
            won: true,
            completedAt: new Date().toISOString(),
          }
        : {
            timeMs: parsed.data.timeMs ?? null,
            foundCount:
              parsed.data.foundCount ??
              ((game.config as { words?: string[] }).words?.length ?? 0),
            completedAt: new Date().toISOString(),
          }

    const progress = await this.gameRepository.upsertProgress(userId, gameId, {
      completed: true,
      stats,
    })

    return { progress, wasAlreadyCompleted, game }
  }
}
