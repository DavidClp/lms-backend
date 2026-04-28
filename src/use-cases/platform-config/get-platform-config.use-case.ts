import { IPlatformConfigRepository, PlatformConfigDTO } from '../../repositories/interfaces/IPlatformConfigRepository'

export class GetPlatformConfigUseCase {
  constructor(private readonly platformConfigRepository: IPlatformConfigRepository) {}

  async execute(): Promise<PlatformConfigDTO> {
    return this.platformConfigRepository.get()
  }
}
