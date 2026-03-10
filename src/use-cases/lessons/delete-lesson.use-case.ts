import { ILessonRepository } from '../../repositories/interfaces/ILessonRepository'
import { AppError } from '../../middlewares/error.middleware'

export class DeleteLessonUseCase {
  constructor(private readonly lessonRepository: ILessonRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.lessonRepository.findById(id)
    if (!existing) throw new AppError('Aula não encontrada', 404)
    await this.lessonRepository.delete(id)
  }
}
