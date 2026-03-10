import { IModuleRepository } from '../../repositories/interfaces/IModuleRepository'
import { AppError } from '../../middlewares/error.middleware'

export class DeleteModuleUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.moduleRepository.findById(id)
    if (!existing) throw new AppError('Módulo não encontrado', 404)
    await this.moduleRepository.delete(id)
  }
}
