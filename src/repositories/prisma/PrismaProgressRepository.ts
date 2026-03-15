import { PrismaClient, Prisma } from '@prisma/client'
import {
  IProgressRepository,
  ProgressData,
  ProgressWithDetails,
  QuizResultsByBlock,
  OpenQuestionAnswersByBlock,
} from '../interfaces/IProgressRepository'

type QuizResultItem = { questionId: string; correct: boolean }

/** Converte formato armazenado (única tentativa ou array de tentativas) para última tentativa apenas. */
function getLatestQuizResults(raw: unknown): QuizResultsByBlock {
  if (!raw || typeof raw !== 'object') return {}
  const out: QuizResultsByBlock = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value) || value.length === 0) continue
    const isHistoryFormat = Array.isArray(value[0]) && typeof value[0][0] === 'object'
    out[key] = isHistoryFormat ? (value[value.length - 1] as QuizResultItem[]) : (value as QuizResultItem[])
  }
  return out
}

/** Retorna array de tentativas para um bloco (formato interno). */
function getAttemptsForBlock(raw: unknown, blockKey: string): QuizResultItem[][] {
  if (!raw || typeof raw !== 'object') return []
  const value = (raw as Record<string, unknown>)[blockKey]
  if (!Array.isArray(value) || value.length === 0) return []
  const isHistoryFormat = Array.isArray(value[0]) && value[0].length > 0 && typeof value[0][0] === 'object'
  return isHistoryFormat ? (value as QuizResultItem[][]) : [value as QuizResultItem[]]
}

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
      quizResults: getLatestQuizResults(r.quizResults) ?? undefined,
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
      quizResults: getLatestQuizResults(r.quizResults) ?? undefined,
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
      quizResults: getLatestQuizResults(record.quizResults) ?? undefined,
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
    const raw = existing?.quizResults ?? {}
    const attempts = getAttemptsForBlock(raw, key)
    const nextAttempts = [...attempts, results]
    const nextQuiz = { ...(raw as Record<string, unknown>), [key]: nextAttempts }
    const jsonValue = JSON.parse(JSON.stringify(nextQuiz)) as Prisma.InputJsonValue

    const record = await this.prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, completed: false, quizResults: jsonValue },
      update: { quizResults: jsonValue },
    })

    return {
      ...record,
      quizResults: getLatestQuizResults(record.quizResults) ?? undefined,
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
      quizResults: getLatestQuizResults(record.quizResults) ?? undefined,
      openQuestionAnswers: (record.openQuestionAnswers as OpenQuestionAnswersByBlock) ?? undefined,
    }
  }
}
