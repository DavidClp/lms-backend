import { IStudentModuleAccessRepository } from '../../repositories/interfaces/IStudentModuleAccessRepository'

export class GetStudentModuleAccessUseCase {
  constructor(private readonly studentModuleAccessRepository: IStudentModuleAccessRepository) {}

  async execute(userId: string): Promise<{ moduleIds: string[] }> {
    const moduleIds = await this.studentModuleAccessRepository.getModuleIdsByUserId(userId)
    return { moduleIds }
  }
}
