import { ILessonRepository, LessonWithModule } from '../../repositories/interfaces/ILessonRepository'

export class ListLessonsUseCase {
  constructor(private readonly lessonRepository: ILessonRepository) {}

  async execute(): Promise<LessonWithModule[]> {
    return this.lessonRepository.findAll()
  }
}
