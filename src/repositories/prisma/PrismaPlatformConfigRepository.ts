import { PrismaClient } from '@prisma/client'
import { IPlatformConfigRepository, PlatformConfigDTO } from '../interfaces/IPlatformConfigRepository'

export class PrismaPlatformConfigRepository implements IPlatformConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(): Promise<PlatformConfigDTO> {
    const config = await this.prisma.platformConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    })

    return {
      disableStudentPassword: config.disableStudentPassword,
    }
  }

  async updateDisableStudentPassword(enabled: boolean): Promise<PlatformConfigDTO> {
    const config = await this.prisma.platformConfig.upsert({
      where: { id: 1 },
      update: { disableStudentPassword: enabled },
      create: { id: 1, disableStudentPassword: enabled },
    })

    return {
      disableStudentPassword: config.disableStudentPassword,
    }
  }
}
