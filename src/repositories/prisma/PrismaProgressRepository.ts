import { PrismaClient, Prisma } from '@prisma/client'
import {
  IProgressRepository,
  ProgressData,
  ProgressWithDetails,
  QuizResultsByBlock,
  OpenQuestionAnswersByBlock,
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
      quizResults: (r.quizResults as QuizResultsByBlock) ?? undefined,
      openQuestionAnswers: (r.openQuestionAnswers as OpenQuestionAnswersByBlock) ?? undefined,
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

  async findByLessonId(
    lessonId: string
  ): Promise<(ProgressWithDetails & { user?: { name: string } })[]> {
    const records = await this.prisma.progress.findMany({
      where: { lessonId },
      include: {
        lesson: {
          include: {
            module: {
              select: { id: true, title: true, order: true },
            },
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      lessonId: r.lessonId,
      completed: r.completed,
      completedAt: r.completedAt,
      quizResults: (r.quizResults as QuizResultsByBlock) ?? undefined,
      openQuestionAnswers: (r.openQuestionAnswers as OpenQuestionAnswersByBlock) ?? undefined,
      createdAt: r.createdAt,
      user: r.user,
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

    return {
      ...record,
      quizResults: (record.quizResults as QuizResultsByBlock) ?? undefined,
      openQuestionAnswers: (record.openQuestionAnswers as OpenQuestionAnswersByBlock) ?? undefined,
    }
  }

  async updateQuizResults(
    userId: string,
    lessonId: string,
    blockIndex: number,
    results: { questionId: string; correct: boolean }[]
  ): Promise<ProgressData> {
    const key = String(blockIndex)
    const existing = await this.prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })
    const currentQuiz = (existing?.quizResults as QuizResultsByBlock) ?? {}
    const alreadyAnswered = Array.isArray(currentQuiz[key]) && currentQuiz[key].length > 0
    const nextQuiz: QuizResultsByBlock = alreadyAnswered
      ? currentQuiz
      : { ...currentQuiz, [key]: results }

    const record = await this.prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, completed: false, quizResults: nextQuiz },
      update: { quizResults: nextQuiz },
    })

    return {
      ...record,
      quizResults: (record.quizResults as QuizResultsByBlock) ?? undefined,
      openQuestionAnswers: (record.openQuestionAnswers as OpenQuestionAnswersByBlock) ?? undefined,
    }
  }

  async updateOpenQuestionAnswer(
    userId: string,
    lessonId: string,
    blockIndex: number,
    answer: string
  ): Promise<ProgressData> {
    const key = String(blockIndex)
    const existing = await this.prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })
    const current = (existing?.openQuestionAnswers as OpenQuestionAnswersByBlock) ?? {}
    const next: OpenQuestionAnswersByBlock = { ...current, [key]: answer }
    const jsonValue = JSON.parse(JSON.stringify(next)) as Prisma.InputJsonValue

    const record = await this.prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, completed: false, openQuestionAnswers: jsonValue },
      update: { openQuestionAnswers: jsonValue },
    })

    return {
      ...record,
      quizResults: (record.quizResults as QuizResultsByBlock) ?? undefined,
      openQuestionAnswers: (record.openQuestionAnswers as OpenQuestionAnswersByBlock) ?? undefined,
    }
  }
}
