import { z } from 'zod'
import { ILessonRepository, LessonData } from '../../repositories/interfaces/ILessonRepository'
import { AppError } from '../../middlewares/error.middleware'

const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('TEXT'), value: z.string() }),
  z.object({ type: z.literal('VIDEO'), url: z.string().url(), title: z.string().optional() }),
  z.object({
    type: z.literal('ACTIVITY_CHECKLIST'),
    items: z.array(z.string()),
    title: z.string().optional(),
  }),
  z.object({
    type: z.literal('QUIZ'),
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.object({ id: z.string(), text: z.string() })),
      correctOptionId: z.string(),
    })),
  }),
  z.object({
    type: z.literal('IMAGES'),
    images: z.array(z.object({
      id: z.string().uuid(),
      caption: z.string().optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })),
    cardWithBorder: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('OPEN_QUESTION'),
    question: z.string(),
  }),
])

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().positive().optional(),
  content: z.array(contentBlockSchema).optional(),
  moduleId: z.string().uuid().optional(),
})

export class UpdateLessonUseCase {
  constructor(private readonly lessonRepository: ILessonRepository) {}

  async execute(id: string, input: unknown): Promise<LessonData> {
    const existing = await this.lessonRepository.findById(id)
    if (!existing) throw new AppError('Aula não encontrada', 404)

    const parsed = updateLessonSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    return this.lessonRepository.update(id, parsed.data)
  }
}
