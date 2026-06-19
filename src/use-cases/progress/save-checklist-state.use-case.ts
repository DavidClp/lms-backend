import { z } from 'zod'
import { IProgressRepository, ProgressData } from '../../repositories/interfaces/IProgressRepository'
import { AppError } from '../../middlewares/error.middleware'

const schema = z.object({
  lessonId: z.string().uuid(),
  blockIndex: z.number().int().min(0),
  checked: z.array(z.boolean()),
})

export class SaveChecklistStateUseCase {
  constructor(private readonly progressRepository: IProgressRepository) {}

  async execute(userId: string, input: unknown): Promise<ProgressData> {
    const parsed = schema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }
    return this.progressRepository.updateChecklistState(
      userId,
      parsed.data.lessonId,
      parsed.data.blockIndex,
      parsed.data.checked,
    )
  }
}
