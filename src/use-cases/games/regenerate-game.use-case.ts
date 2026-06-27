import { IGameRepository } from '../../repositories/interfaces/IGameRepository'
import { buildConfigFromInput, type WordSearchConfig } from '../../services/word-search.service'
import { AppError } from '../../middlewares/error.middleware'

export class RegenerateGameGridUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(id: string) {
    const existing = await this.gameRepository.findById(id)
    if (!existing) throw new AppError('Jogo não encontrado', 404)

    const currentConfig = existing.config as WordSearchConfig
    let nextConfig
    try {
      nextConfig = buildConfigFromInput({
        words: currentConfig.words,
        difficulty: existing.difficulty,
        allowDiagonal: currentConfig.allowDiagonal,
        allowBackwards: currentConfig.allowBackwards,
        timeLimitSeconds: currentConfig.timeLimitSeconds,
        gridSize: currentConfig.gridSize,
      })
    } catch (e) {
      throw new AppError(e instanceof Error ? e.message : 'Erro ao gerar grade', 400)
    }

    return this.gameRepository.update(id, { config: nextConfig })
  }
}
