/** Por bloco (índice): lista de { questionId, correct } */
export type QuizResultsByBlock = Record<string, { questionId: string; correct: boolean }[]>
/** Por bloco (índice): resposta em texto do aluno */
export type OpenQuestionAnswersByBlock = Record<string, string>

/** Por bloco (índice): estado dos checkboxes */
export type ChecklistStateByBlock = Record<string, boolean[]>

/** Resultado de jogo por índice do bloco */
export interface GameResultItem {
  completed: boolean
  timeMs?: number
  foundWords: string[]
}

export type GameResultsByBlock = Record<string, GameResultItem>

export interface ProgressData {
  id: string
  userId: string
  lessonId: string
  completed: boolean
  completedAt: Date | null
  quizResults?: QuizResultsByBlock | null
  openQuestionAnswers?: OpenQuestionAnswersByBlock | null
  checklistState?: ChecklistStateByBlock | null
  gameResults?: GameResultsByBlock | null
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
  findByLessonId(lessonId: string): Promise<(ProgressWithDetails & { user?: { name: string } })[]>
  upsert(userId: string, lessonId: string, completed: boolean): Promise<ProgressData>
  updateQuizResults(
    userId: string,
    lessonId: string,
    blockIndex: number,
    results: { questionId: string; correct: boolean }[]
  ): Promise<ProgressData>
  updateOpenQuestionAnswer(
    userId: string,
    lessonId: string,
    blockIndex: number,
    answer: string
  ): Promise<ProgressData>
  updateChecklistState(
    userId: string,
    lessonId: string,
    blockIndex: number,
    checked: boolean[]
  ): Promise<ProgressData>
  updateGameResult(
    userId: string,
    lessonId: string,
    blockIndex: number,
    result: GameResultItem
  ): Promise<ProgressData>
}
