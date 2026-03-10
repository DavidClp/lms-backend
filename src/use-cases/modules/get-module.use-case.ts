import { IModuleRepository, ModuleData } from '../../repositories/interfaces/IModuleRepository'
import { AppError } from '../../middlewares/error.middleware'

export class GetModuleUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(id: string): Promise<ModuleData> {
    const module = await this.moduleRepository.findById(id)
    if (!module) throw new AppError('Módulo não encontrado', 404)
    return module
  }
}
