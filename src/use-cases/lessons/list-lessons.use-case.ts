import { ILessonRepository, LessonWithModule } from '../../repositories/interfaces/ILessonRepository'
import type { ProfileMode } from '../../repositories/interfaces/IUserRepository'

export class ListLessonsUseCase {
  constructor(private readonly lessonRepository: ILessonRepository) {}

  async execute(options?: { profileMode?: ProfileMode; role?: 'ADMIN' | 'STUDENT' }): Promise<LessonWithModule[]> {
    if (options?.role === 'ADMIN' || !options?.profileMode) {
      return this.lessonRepository.findAll()
    }
    if (options.profileMode === 'KIDS') {
      return this.lessonRepository.findAll(['KIDS', 'ALL'])
    }
    return this.lessonRepository.findAll(['ADULT', 'ALL'])
  }
}
