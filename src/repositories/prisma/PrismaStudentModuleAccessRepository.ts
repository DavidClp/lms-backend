import { PrismaClient } from '@prisma/client'
import { IStudentModuleAccessRepository } from '../interfaces/IStudentModuleAccessRepository'

export class PrismaStudentModuleAccessRepository implements IStudentModuleAccessRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getModuleIdsByUserId(userId: string): Promise<string[]> {
    const rows = await this.prisma.studentModuleAccess.findMany({
      where: { userId },
      select: { moduleId: true },
    })
    return rows.map((r) => r.moduleId)
  }

  async setModulesForUser(userId: string, moduleIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.studentModuleAccess.deleteMany({ where: { userId } })
      if (moduleIds.length > 0) {
        await tx.studentModuleAccess.createMany({
          data: moduleIds.map((moduleId) => ({ userId, moduleId })),
        })
      }
    })
  }
}
