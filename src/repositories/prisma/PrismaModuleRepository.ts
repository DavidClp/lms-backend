import { PrismaClient } from '@prisma/client'
import {
  IModuleRepository,
  ModuleData,
  ModuleWithCount,
  CreateModuleDTO,
  UpdateModuleDTO,
  ModuleAudience,
  KidsMeta,
} from '../interfaces/IModuleRepository'

function mapModule(m: {
  id: string
  title: string
  description: string | null
  order: number
  audience: string
  kidsMeta: unknown
  createdAt: Date
  updatedAt: Date
}): ModuleData {
  return {
    ...m,
    audience: m.audience as ModuleAudience,
    kidsMeta: (m.kidsMeta as KidsMeta | null) ?? null,
  }
}

export class PrismaModuleRepository implements IModuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(audienceFilter?: ModuleAudience[]): Promise<ModuleWithCount[]> {
    const modules = await this.prisma.module.findMany({
      where: audienceFilter?.length
        ? { audience: { in: audienceFilter } }
        : undefined,
      include: {
        _count: { select: { lessons: true } },
      },
      orderBy: { order: 'asc' },
    })

    return modules.map(({ _count, ...m }) => ({
      ...mapModule(m),
      lessonsCount: _count.lessons,
    }))
  }

  async findById(id: string): Promise<ModuleData | null> {
    const module = await this.prisma.module.findUnique({ where: { id } })
    return module ? mapModule(module) : null
  }

  async create(data: CreateModuleDTO): Promise<ModuleData> {
    const module = await this.prisma.module.create({
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        audience: data.audience ?? 'ADULT',
        kidsMeta: data.kidsMeta ? (data.kidsMeta as object) : undefined,
      },
    })
    return mapModule(module)
  }

  async update(id: string, data: UpdateModuleDTO): Promise<ModuleData> {
    const module = await this.prisma.module.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        audience: data.audience,
        kidsMeta: data.kidsMeta ? (data.kidsMeta as object) : undefined,
      },
    })
    return mapModule(module)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.module.delete({ where: { id } })
  }
}
