import { PrismaClient } from '@prisma/client'
import {
  IModuleRepository,
  ModuleData,
  ModuleWithCount,
  CreateModuleDTO,
  UpdateModuleDTO,
} from '../interfaces/IModuleRepository'

export class PrismaModuleRepository implements IModuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<ModuleWithCount[]> {
    const modules = await this.prisma.module.findMany({
      include: {
        _count: { select: { lessons: true } },
      },
      orderBy: { order: 'asc' },
    })

    return modules.map(({ _count, ...m }) => ({
      ...m,
      lessonsCount: _count.lessons,
    }))
  }

  async findById(id: string): Promise<ModuleData | null> {
    return this.prisma.module.findUnique({ where: { id } })
  }

  async create(data: CreateModuleDTO): Promise<ModuleData> {
    return this.prisma.module.create({ data })
  }

  async update(id: string, data: UpdateModuleDTO): Promise<ModuleData> {
    return this.prisma.module.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.module.delete({ where: { id } })
  }
}
