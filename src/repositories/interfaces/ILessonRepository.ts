export interface LessonData {
  id: string
  moduleId: string
  title: string
  order: number
  content: unknown[]
  createdAt: Date
  updatedAt: Date
}

export interface LessonWithModule extends LessonData {
  module: {
    id: string
    title: string
    order: number
  }
}

export interface CreateLessonDTO {
  moduleId: string
  title: string
  order: number
  content?: unknown[]
}

export interface UpdateLessonDTO {
  title?: string
  order?: number
  content?: unknown[]
  moduleId?: string
}

export interface ILessonRepository {
  findAll(): Promise<LessonWithModule[]>
  findById(id: string): Promise<LessonWithModule | null>
  findByModuleId(moduleId: string): Promise<LessonData[]>
  create(data: CreateLessonDTO): Promise<LessonData>
  update(id: string, data: UpdateLessonDTO): Promise<LessonData>
  delete(id: string): Promise<void>
}
