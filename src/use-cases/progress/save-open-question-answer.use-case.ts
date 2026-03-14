import { z } from 'zod'
import { IProgressRepository, ProgressData } from '../../repositories/interfaces/IProgressRepository'
import { AppError } from '../../middlewares/error.middleware'

const saveOpenQuestionSchema = z.object({
  lessonId: z.string().uuid(),
  blockIndex: z.number().int().min(0),
  answer: z.string(),
})

export class SaveOpenQuestionAnswerUseCase {
  constructor(private readonly progressRepository: IProgressRepository) {}

  async execute(userId: string, input: unknown): Promise<ProgressData> {
    const parsed = saveOpenQuestionSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400)
    }
    return this.progressRepository.updateOpenQuestionAnswer(
      userId,
      parsed.data.lessonId,
      parsed.data.blockIndex,
      parsed.data.answer
    )
  }
}
