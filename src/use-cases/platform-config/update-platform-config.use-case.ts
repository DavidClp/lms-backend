import { IPlatformConfigRepository, PlatformConfigDTO } from '../../repositories/interfaces/IPlatformConfigRepository'
import { AppError } from '../../middlewares/error.middleware'

export class UpdatePlatformConfigUseCase {
  constructor(private readonly platformConfigRepository: IPlatformConfigRepository) {}

  async execute(disableStudentPassword: unknown): Promise<PlatformConfigDTO> {
    if (typeof disableStudentPassword !== 'boolean') {
      throw new AppError('disableStudentPassword deve ser boolean', 400)
    }

    return this.platformConfigRepository.updateDisableStudentPassword(disableStudentPassword)
  }
}
