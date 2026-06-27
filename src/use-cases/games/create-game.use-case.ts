import { IGameRepository, GameData } from '../../repositories/interfaces/IGameRepository'
import { buildConfigFromInput } from '../../services/word-search.service'
import { buildHangmanConfig } from '../../services/hangman.service'
import { AppError } from '../../middlewares/error.middleware'
import { createGameSchema } from './game.schemas'

export class CreateGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(input: unknown): Promise<GameData> {
    const parsed = createGameSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    try {
      if (parsed.data.type === 'HANGMAN') {
        const config = buildHangmanConfig({
          secretWord: parsed.data.config.secretWord,
          hint: parsed.data.config.hint,
          category: parsed.data.config.category,
          difficulty: parsed.data.difficulty,
          maxWrongGuesses: parsed.data.config.maxWrongGuesses,
        })
        return this.gameRepository.create({
          title: parsed.data.title,
          description: parsed.data.description,
          type: 'HANGMAN',
          difficulty: parsed.data.difficulty,
          config,
          isActive: parsed.data.isActive,
          order: parsed.data.order,
        })
      }

      const config = buildConfigFromInput({
        words: parsed.data.config.words,
        difficulty: parsed.data.difficulty,
        allowDiagonal: parsed.data.config.allowDiagonal,
        allowBackwards: parsed.data.config.allowBackwards,
        timeLimitSeconds: parsed.data.config.timeLimitSeconds,
        gridSize: parsed.data.config.gridSize,
      })

      return this.gameRepository.create({
        title: parsed.data.title,
        description: parsed.data.description,
        type: 'WORD_SEARCH',
        difficulty: parsed.data.difficulty,
        config,
        isActive: parsed.data.isActive,
        order: parsed.data.order,
      })
    } catch (e) {
      throw new AppError(e instanceof Error ? e.message : 'Erro ao criar jogo', 400)
    }
  }
}
