import { ILessonRepository, LessonWithModule } from '../../repositories/interfaces/ILessonRepository'
import { AppError } from '../../middlewares/error.middleware'

export class GetLessonUseCase {
  constructor(private readonly lessonRepository: ILessonRepository) {}

  async execute(id: string): Promise<LessonWithModule> {
    const lesson = await this.lessonRepository.findById(id)
    if (!lesson) throw new AppError('Aula não encontrada', 404)
    return lesson
  }
}
