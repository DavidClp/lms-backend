import { z } from 'zod'
import { ILessonRepository, LessonData, CreateLessonDTO } from '../../repositories/interfaces/ILessonRepository'
import { IModuleRepository } from '../../repositories/interfaces/IModuleRepository'
import { AppError } from '../../middlewares/error.middleware'

const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('TEXT'), value: z.string() }),
  z.object({ type: z.literal('VIDEO'), url: z.string().url() }),
  z.object({
    type: z.literal('ACTIVITY_CHECKLIST'),
    items: z.array(z.string()),
    title: z.string().optional(),
  }),
  z.object({
    type: z.literal('QUIZ'),
    question: z.string(),
    options: z.array(z.object({ id: z.string(), text: z.string() })),
    correctOptionId: z.string(),
  }),
  z.object({
    type: z.literal('IMAGES'),
    imageIds: z.array(z.string().uuid()),
    caption: z.string().optional(),
  }),
])

const createLessonSchema = z.object({
  moduleId: z.string().uuid('moduleId deve ser um UUID válido'),
  title: z.string().min(1, 'Título é obrigatório'),
  order: z.number().int().positive('Ordem deve ser um número positivo'),
  content: z.array(contentBlockSchema).default([]),
})

export class CreateLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async execute(input: unknown): Promise<LessonData> {
    const parsed = createLessonSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    const module = await this.moduleRepository.findById(parsed.data.moduleId)
    if (!module) throw new AppError('Módulo não encontrado', 404)

    return this.lessonRepository.create(parsed.data as CreateLessonDTO)
  }
}
