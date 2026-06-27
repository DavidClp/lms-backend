import { IGameRepository } from '../../repositories/interfaces/IGameRepository'
import { AppError } from '../../middlewares/error.middleware'

export class DeleteGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.gameRepository.findById(id)
    if (!existing) throw new AppError('Jogo não encontrado', 404)
    await this.gameRepository.delete(id)
  }
}
