import { z } from 'zod'
import { IProgressRepository, ProgressData } from '../../repositories/interfaces/IProgressRepository'
import { AppError } from '../../middlewares/error.middleware'

const saveQuizSchema = z.object({
  lessonId: z.string().uuid(),
  blockIndex: z.number().int().min(0),
  results: z.array(
    z.object({
      questionId: z.string(),
      correct: z.boolean(),
    })
  ),
})

export class SaveQuizResultsUseCase {
  constructor(private readonly progressRepository: IProgressRepository) {}

  async execute(userId: string, input: unknown): Promise<ProgressData> {
    const parsed = saveQuizSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400)
    }
    return this.progressRepository.updateQuizResults(
      userId,
      parsed.data.lessonId,
      parsed.data.blockIndex,
      // @ts-ignore
      parsed.data.results
    )
  }
}
