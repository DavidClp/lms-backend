import { IStudentModuleAccessRepository } from '../../repositories/interfaces/IStudentModuleAccessRepository'

export class UpdateStudentModuleAccessUseCase {
  constructor(private readonly studentModuleAccessRepository: IStudentModuleAccessRepository) {}

  async execute(userId: string, moduleIds: string[]): Promise<{ moduleIds: string[] }> {
    await this.studentModuleAccessRepository.setModulesForUser(userId, moduleIds)
    return { moduleIds }
  }
}
