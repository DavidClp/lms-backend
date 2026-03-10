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
    return lessons.map((l) => ({ ...l, content: l.content as unknown[] }))
  }

  async findById(id: string): Promise<LessonWithModule | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { select: moduleSelect } },
    })
    if (!lesson) return null
    return { ...lesson, content: lesson.content as unknown[] }
  }

  async findByModuleId(moduleId: string): Promise<LessonData[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    })
    return lessons.map((l) => ({ ...l, content: l.content as unknown[] }))
  }

  async create(data: CreateLessonDTO): Promise<LessonData> {
    const lesson = await this.prisma.lesson.create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        order: data.order,
        content: (data.content ?? []) as object[],
      },
    })
    return { ...lesson, content: lesson.content as unknown[] }
  }

  async update(id: string, data: UpdateLessonDTO): Promise<LessonData> {
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.order !== undefined) updateData.order = data.order
    if (data.content !== undefined) updateData.content = data.content as object[]
    if (data.moduleId !== undefined) updateData.moduleId = data.moduleId

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: updateData,
    })
    return { ...lesson, content: lesson.content as unknown[] }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lesson.delete({ where: { id } })
  }
}
