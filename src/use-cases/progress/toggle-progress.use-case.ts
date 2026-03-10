import { z } from 'zod'
import {
  IProgressRepository,
  ProgressData,
} from '../../repositories/interfaces/IProgressRepository'
import { ILessonRepository } from '../../repositories/interfaces/ILessonRepository'
import { AppError } from '../../middlewares/error.middleware'

const toggleProgressSchema = z.object({
  lessonId: z.string().uuid('lessonId deve ser um UUID válido'),
  completed: z.boolean(),
})

export class ToggleProgressUseCase {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(userId: string, input: unknown): Promise<ProgressData> {
    const parsed = toggleProgressSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    const lesson = await this.lessonRepository.findById(parsed.data.lessonId)
    if (!lesson) throw new AppError('Aula não encontrada', 404)

    return this.progressRepository.upsert(userId, parsed.data.lessonId, parsed.data.completed)
  }
}
