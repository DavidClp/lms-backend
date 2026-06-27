import { IGameRepository, GameData } from '../../repositories/interfaces/IGameRepository'
import { buildConfigFromInput, type WordSearchConfig } from '../../services/word-search.service'
import { buildHangmanConfig, type HangmanConfig } from '../../services/hangman.service'
import { AppError } from '../../middlewares/error.middleware'
import { updateGameSchema, hangmanInputSchema } from './game.schemas'

export class UpdateGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(id: string, input: unknown): Promise<GameData> {
    const existing = await this.gameRepository.findById(id)
    if (!existing) throw new AppError('Jogo não encontrado', 404)

    const parsed = updateGameSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    if (parsed.data.type && parsed.data.type !== existing.type) {
      throw new AppError('Não é possível alterar o tipo do jogo', 400)
    }

    const difficulty = parsed.data.difficulty ?? existing.difficulty

    if (existing.type === 'HANGMAN') {
      const current = existing.config as HangmanConfig
      const cfg = parsed.data.config
      const isHangmanInput =
        cfg &&
        typeof cfg === 'object' &&
        'secretWord' in cfg &&
        hangmanInputSchema.safeParse(cfg).success
      let nextConfig = current
      if (isHangmanInput && cfg && 'secretWord' in cfg) {
        try {
          nextConfig = buildHangmanConfig({
            secretWord: cfg.secretWord ?? current.displayWord,
            hint: cfg.hint ?? current.hint,
            category: cfg.category !== undefined ? cfg.category : current.category,
            difficulty,
            maxWrongGuesses:
              'maxWrongGuesses' in cfg && cfg.maxWrongGuesses !== undefined
                ? cfg.maxWrongGuesses
                : current.maxWrongGuesses,
          })
        } catch (e) {
          throw new AppError(e instanceof Error ? e.message : 'Erro ao salvar forca', 400)
        }
      } else if (parsed.data.difficulty !== undefined) {
        nextConfig = buildHangmanConfig({
          secretWord: current.displayWord,
          hint: current.hint,
          category: current.category,
          difficulty,
          maxWrongGuesses: current.maxWrongGuesses,
        })
      }

      return this.gameRepository.update(id, {
        title: parsed.data.title,
        description: parsed.data.description,
        difficulty,
        config: nextConfig,
        isActive: parsed.data.isActive,
        order: parsed.data.order,
      })
    }

    const currentConfig = existing.config as WordSearchConfig
    let nextConfig = currentConfig

    const shouldRegenerate =
      parsed.data.regenerateGrid ||
      parsed.data.config !== undefined ||
      parsed.data.difficulty !== undefined

    if (shouldRegenerate) {
      const cfg = parsed.data.config
      const words =
        cfg && 'words' in cfg && Array.isArray(cfg.words) ? cfg.words : currentConfig.words
      const explicitGridSize = cfg && 'gridSize' in cfg ? cfg.gridSize : undefined

      try {
        nextConfig = buildConfigFromInput({
          words,
          difficulty,
          allowDiagonal:
            cfg && 'allowDiagonal' in cfg ? cfg.allowDiagonal : currentConfig.allowDiagonal,
          allowBackwards:
            cfg && 'allowBackwards' in cfg ? cfg.allowBackwards : currentConfig.allowBackwards,
          timeLimitSeconds:
            cfg && 'timeLimitSeconds' in cfg && cfg.timeLimitSeconds !== undefined
              ? cfg.timeLimitSeconds
              : currentConfig.timeLimitSeconds,
          gridSize: explicitGridSize != null ? explicitGridSize : undefined,
        })
      } catch (e) {
        throw new AppError(e instanceof Error ? e.message : 'Erro ao gerar grade', 400)
      }
    }

    return this.gameRepository.update(id, {
      title: parsed.data.title,
      description: parsed.data.description,
      difficulty,
      config: nextConfig,
      isActive: parsed.data.isActive,
      order: parsed.data.order,
    })
  }
}
