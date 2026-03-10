import { ILessonRepository, LessonData } from '../../repositories/interfaces/ILessonRepository'
import { IModuleRepository } from '../../repositories/interfaces/IModuleRepository'
import { AppError } from '../../middlewares/error.middleware'

export class ListLessonsByModuleUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async execute(moduleId: string): Promise<LessonData[]> {
    const module = await this.moduleRepository.findById(moduleId)
    if (!module) throw new AppError('Módulo não encontrado', 404)
    return this.lessonRepository.findByModuleId(moduleId)
  }
}
