export interface ProgressData {
  id: string
  userId: string
  lessonId: string
  completed: boolean
  completedAt: Date | null
  createdAt: Date
}

export interface ProgressWithDetails extends ProgressData {
  lesson: {
    id: string
    title: string
    order: number
    moduleId: string
    module: {
      id: string
      title: string
      order: number
    }
  }
}

export interface IProgressRepository {
  findByUserId(userId: string): Promise<ProgressWithDetails[]>
  upsert(userId: string, lessonId: string, completed: boolean): Promise<ProgressData>
}
