import { z } from 'zod'
import { IProgressRepository, ProgressData } from '../../repositories/interfaces/IProgressRepository'
import { AppError } from '../../middlewares/error.middleware'

const schema = z.object({
  lessonId: z.string().uuid(),
  blockIndex: z.number().int().min(0),
  completed: z.boolean(),
  timeMs: z.number().int().min(0).optional(),
  foundWords: z.array(z.string()).optional(),
})

export class SaveGameResultUseCase {
  constructor(private readonly progressRepository: IProgressRepository) {}

  async execute(userId: string, input: unknown): Promise<ProgressData> {
    const parsed = schema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }
    return this.progressRepository.updateGameResult(
      userId,
      parsed.data.lessonId,
      parsed.data.blockIndex,
      {
        completed: parsed.data.completed,
        timeMs: parsed.data.timeMs,
        foundWords: parsed.data.foundWords ?? [],
      },
    )
  }
}
