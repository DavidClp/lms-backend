import { ILessonRepository, LessonWithModule } from '../../repositories/interfaces/ILessonRepository'
import { IStudentModuleAccessRepository } from '../../repositories/interfaces/IStudentModuleAccessRepository'
import { AppError } from '../../middlewares/error.middleware'

type AuthContext = { userId: string; role: string }

export class GetLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly studentModuleAccessRepository: IStudentModuleAccessRepository,
  ) {}

  async execute(id: string, auth?: AuthContext): Promise<LessonWithModule> {
    const lesson = await this.lessonRepository.findById(id)
    if (!lesson) throw new AppError('Aula não encontrada', 404)
    if (auth?.role === 'STUDENT') {
      const allowedModuleIds = await this.studentModuleAccessRepository.getModuleIdsByUserId(auth.userId)
      if (!allowedModuleIds.includes(lesson.moduleId)) {
        throw new AppError('Acesso negado a esta aula', 403)
      }
    }
    return lesson
  }
}
