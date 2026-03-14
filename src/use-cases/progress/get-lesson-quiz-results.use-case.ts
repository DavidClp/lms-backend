import { ILessonRepository } from '../../repositories/interfaces/ILessonRepository'
import {
  IProgressRepository,
  QuizResultsByBlock,
} from '../../repositories/interfaces/IProgressRepository'
import { AppError } from '../../middlewares/error.middleware'

export interface LessonQuizResultsStudent {
  userId: string
  userName: string
  quizResults: QuizResultsByBlock
}

export interface LessonQuizResultsResponse {
  lessonId: string
  lessonTitle: string
  quizBlockIndexes: number[]
  students: LessonQuizResultsStudent[]
}

export class GetLessonQuizResultsUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly lessonRepository: ILessonRepository
  ) {}

  async execute(lessonId: string): Promise<LessonQuizResultsResponse> {
    const lesson = await this.lessonRepository.findById(lessonId)
    if (!lesson) throw new AppError('Aula não encontrada', 404)

    const content = lesson.content as { type: string }[]
    const quizBlockIndexes = content
      .map((block, i) => (block.type === 'QUIZ' ? i : -1))
      .filter((i) => i >= 0)

    const progressList = await this.progressRepository.findByLessonId(lessonId)
    const students: LessonQuizResultsStudent[] = progressList
      .filter((p) => p.quizResults && Object.keys(p.quizResults).length > 0)
      .map((p) => ({
        userId: p.userId,
        userName: (p as { user?: { name: string } }).user?.name ?? 'Aluno',
        quizResults: p.quizResults ?? {},
      }))

    return {
      lessonId,
      lessonTitle: lesson.title,
      quizBlockIndexes,
      students,
    }
  }
}
