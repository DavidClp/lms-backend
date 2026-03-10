import { IModuleRepository, ModuleWithCount } from '../../repositories/interfaces/IModuleRepository'

export class ListModulesUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(): Promise<ModuleWithCount[]> {
    return this.moduleRepository.findAll()
  }
}
