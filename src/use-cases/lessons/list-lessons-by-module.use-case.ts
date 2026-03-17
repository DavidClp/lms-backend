import { ILessonRepository, LessonData } from '../../repositories/interfaces/ILessonRepository'
import { IModuleRepository } from '../../repositories/interfaces/IModuleRepository'
import { IStudentModuleAccessRepository } from '../../repositories/interfaces/IStudentModuleAccessRepository'
import { AppError } from '../../middlewares/error.middleware'

type AuthContext = { userId: string; role: string }

export class ListLessonsByModuleUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly studentModuleAccessRepository: IStudentModuleAccessRepository,
  ) {}

  async execute(moduleId: string, auth?: AuthContext): Promise<LessonData[]> {
    const module = await this.moduleRepository.findById(moduleId)
    if (!module) throw new AppError('Módulo não encontrado', 404)
    if (auth?.role === 'STUDENT') {
      const allowedModuleIds = await this.studentModuleAccessRepository.getModuleIdsByUserId(auth.userId)
      if (!allowedModuleIds.includes(moduleId)) {
        throw new AppError('Acesso negado a este módulo', 403)
      }
    }
    const lessons = await this.lessonRepository.findByModuleId(moduleId)
    if (auth?.role === 'STUDENT') {
      return lessons.filter((l) => l.isActive)
    }
    return lessons
  }
}
