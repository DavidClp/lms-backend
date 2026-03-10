import { PrismaClient } from '@prisma/client'
import {
  IProgressRepository,
  ProgressData,
  ProgressWithDetails,
} from '../interfaces/IProgressRepository'

export class PrismaProgressRepository implements IProgressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<ProgressWithDetails[]> {
    const records = await this.prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            module: {
              select: { id: true, title: true, order: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      lessonId: r.lessonId,
      completed: r.completed,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      lesson: {
        id: r.lesson.id,
        title: r.lesson.title,
        order: r.lesson.order,
        moduleId: r.lesson.moduleId,
        module: r.lesson.module,
      },
    }))
  }

  async upsert(userId: string, lessonId: string, completed: boolean): Promise<ProgressData> {
    const completedAt = completed ? new Date() : null

    const record = await this.prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, completed, completedAt },
      update: { completed, completedAt },
    })

    return record
  }
}
