import { z } from 'zod'
import { ILessonRepository, LessonData } from '../../repositories/interfaces/ILessonRepository'
import { IImageRepository } from '../../repositories/interfaces/IImageRepository'
import { AppError } from '../../middlewares/error.middleware'

function getImageIdsFromContent(content: unknown[]): string[] {
  const ids: string[] = []
  for (const block of content) {
    if (typeof block !== 'object' || block === null) continue
    const b = block as { type?: string; images?: { id?: string }[] }
    if (b.type === 'IMAGES' && Array.isArray(b.images)) {
      for (const img of b.images) {
        if (typeof img?.id === 'string') ids.push(img.id)
      }
    }
  }
  return ids
}

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
    imageLayout: z.enum(['column', 'row']).optional(),
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
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly imageRepository: IImageRepository,
  ) {}

  async execute(id: string, input: unknown): Promise<LessonData> {
    const existing = await this.lessonRepository.findById(id)
    if (!existing) throw new AppError('Aula não encontrada', 404)

    const parsed = updateLessonSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    const updated = await this.lessonRepository.update(id, parsed.data)

    if (parsed.data.content !== undefined) {
      const oldContent = (existing.content || []) as unknown[]
      const newContent = (parsed.data.content || []) as unknown[]
      const oldIds = getImageIdsFromContent(oldContent)
      const newIdsSet = new Set(getImageIdsFromContent(newContent))
      const removedIds = oldIds.filter((imageId) => !newIdsSet.has(imageId))
      if (removedIds.length > 0) {
        const allLessons = await this.lessonRepository.findAll()
        const stillUsed = new Set<string>()
        for (const lesson of allLessons) {
          const content = lesson.id === id ? newContent : (lesson.content || []) as unknown[]
          getImageIdsFromContent(content).forEach((imageId) => stillUsed.add(imageId))
        }
        for (const imageId of removedIds) {
          if (!stillUsed.has(imageId)) {
            await this.imageRepository.deleteById(imageId).catch(() => {})
          }
        }
      }
    }

    return updated
  }
}
