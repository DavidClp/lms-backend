import { z } from 'zod'
import { ILessonRepository, LessonData, CreateLessonDTO } from '../../repositories/interfaces/ILessonRepository'
import { IModuleRepository } from '../../repositories/interfaces/IModuleRepository'
import { AppError } from '../../middlewares/error.middleware'
import { contentBlockSchema } from '../../schemas/content-block.schema'

const createLessonSchema = z.object({
  moduleId: z.string().uuid('moduleId deve ser um UUID válido'),
  title: z.string().min(1, 'Título é obrigatório'),
  order: z.number().int().positive('Ordem deve ser um número positivo'),
  kind: z.enum(['LESSON', 'EXAM']).optional().default('LESSON'),
  content: z.array(contentBlockSchema).default([]),
  isActive: z.boolean().optional(),
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
