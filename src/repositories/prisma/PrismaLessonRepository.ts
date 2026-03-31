import { PrismaClient } from '@prisma/client'
import {
  ILessonRepository,
  LessonData,
  LessonWithModule,
  CreateLessonDTO,
  UpdateLessonDTO,
} from '../interfaces/ILessonRepository'

const moduleSelect = {
  id: true,
  title: true,
  order: true,
}

export class PrismaLessonRepository implements ILessonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<LessonWithModule[]> {
    const lessons = await this.prisma.lesson.findMany({
      include: { module: { select: moduleSelect } },
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
    })
    return lessons.map((l) => ({ ...(l as any), kind: (l as any).kind ?? 'LESSON', content: (l as any).content as unknown[] }))
  }

  async findById(id: string): Promise<LessonWithModule | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { select: moduleSelect } },
    })
    if (!lesson) return null
    return { ...(lesson as any), kind: (lesson as any).kind ?? 'LESSON', content: (lesson as any).content as unknown[] }
  }

  async findByModuleId(moduleId: string): Promise<LessonData[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    })
    return lessons.map((l) => ({ ...(l as any), kind: (l as any).kind ?? 'LESSON', content: (l as any).content as unknown[] }))
  }

  async create(data: CreateLessonDTO): Promise<LessonData> {
    const lesson = await (this.prisma.lesson as any).create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        order: data.order,
        kind: data.kind ?? 'LESSON',
        content: (data.content ?? []) as object[],
        isActive: data.isActive ?? true,
      },
    })
    return { ...(lesson as any), kind: (lesson as any).kind ?? (data.kind ?? 'LESSON'), content: (lesson as any).content as unknown[] }
  }

  async update(id: string, data: UpdateLessonDTO): Promise<LessonData> {
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.order !== undefined) updateData.order = data.order
    if (data.kind !== undefined) updateData.kind = data.kind
    if (data.content !== undefined) updateData.content = data.content as object[]
    if (data.moduleId !== undefined) updateData.moduleId = data.moduleId
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const lesson = await (this.prisma.lesson as any).update({
      where: { id },
      data: updateData,
    })
    return { ...(lesson as any), kind: (lesson as any).kind ?? 'LESSON', content: (lesson as any).content as unknown[] }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lesson.delete({ where: { id } })
  }
}
