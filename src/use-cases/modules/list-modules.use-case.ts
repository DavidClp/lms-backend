import { IModuleRepository, ModuleWithCount, ModuleAudience } from '../../repositories/interfaces/IModuleRepository'
import type { ProfileMode } from '../../repositories/interfaces/IUserRepository'

export class ListModulesUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(profileMode?: ProfileMode, role?: 'ADMIN' | 'STUDENT'): Promise<ModuleWithCount[]> {
    if (role === 'ADMIN') {
      return this.moduleRepository.findAll()
    }
    if (!profileMode || profileMode === 'ADULT') {
      return this.moduleRepository.findAll(['ADULT', 'ALL'])
    }
    return this.moduleRepository.findAll(['KIDS', 'ALL'])
  }
}
