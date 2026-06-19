import type { ModuleAudience } from './IModuleRepository'

export interface LessonData {
  id: string
  moduleId: string
  title: string
  order: number
  kind: 'LESSON' | 'EXAM'
  content: unknown[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LessonWithModule extends LessonData {
  module: {
    id: string
    title: string
    order: number
    audience?: 'ADULT' | 'KIDS' | 'ALL'
  }
}

export interface CreateLessonDTO {
  moduleId: string
  title: string
  order: number
  kind?: 'LESSON' | 'EXAM'
  content?: unknown[]
  isActive?: boolean
}

export interface UpdateLessonDTO {
  title?: string
  order?: number
  kind?: 'LESSON' | 'EXAM'
  content?: unknown[]
  moduleId?: string
  isActive?: boolean
}

export interface ILessonRepository {
  findAll(audienceFilter?: ModuleAudience[]): Promise<LessonWithModule[]>
  findById(id: string): Promise<LessonWithModule | null>
  findByModuleId(moduleId: string): Promise<LessonData[]>
  create(data: CreateLessonDTO): Promise<LessonData>
  update(id: string, data: UpdateLessonDTO): Promise<LessonData>
  delete(id: string): Promise<void>
}
