import { Request, Response, NextFunction } from 'express'
import { GetUserProgressUseCase } from '../use-cases/progress/get-user-progress.use-case'
import { ToggleProgressUseCase } from '../use-cases/progress/toggle-progress.use-case'
import { SaveQuizResultsUseCase } from '../use-cases/progress/save-quiz-results.use-case'
import { SaveOpenQuestionAnswerUseCase } from '../use-cases/progress/save-open-question-answer.use-case'
import { SaveChecklistStateUseCase } from '../use-cases/progress/save-checklist-state.use-case'
import { SaveGameResultUseCase } from '../use-cases/progress/save-game-result.use-case'
import { ProcessGamificationEventUseCase } from '../use-cases/gamification/gamification.use-cases'
import { progressRepository, lessonRepository, gamificationRepository, userRepository } from '../repositories'
import { AppError } from '../middlewares/error.middleware'

const gamificationEvents = new ProcessGamificationEventUseCase(gamificationRepository, userRepository)

export const progressController = {
  async getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const progress = await new GetUserProgressUseCase(progressRepository).execute(req.user.id)
      res.json(progress)
    } catch (e) {
      next(e)
    }
  },

  async getUserProgressForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const { userId } = req.params
      if (!userId) {
        throw new AppError('ID do aluno inválido', 400)
      }
      const progress = await new GetUserProgressUseCase(progressRepository).execute(userId)
      res.json(progress)
    } catch (e) {
      next(e)
    }
  },

  async toggleProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const { lessonId, completed } = req.body as { lessonId: string; completed: boolean }
      const existingProgress = (await progressRepository.findByUserId(req.user.id)).find(
        (p) => p.lessonId === lessonId && p.completed,
      )
      const wasAlreadyCompleted = !!existingProgress

      const progress = await new ToggleProgressUseCase(
        progressRepository,
        lessonRepository,
      ).execute(req.user.id, req.body)

      let gamification = null
      if (completed && !wasAlreadyCompleted && req.user.profileMode === 'KIDS') {
        gamification = await gamificationEvents.onMissionComplete(req.user.id)
      }

      res.json({ ...progress, gamification })
    } catch (e) {
      next(e)
    }
  },

  async saveQuizResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const body = req.body as { lessonId: string; blockIndex: number; results: { questionId: string; correct: boolean }[] }
      const existing = await progressRepository.findByUserId(req.user.id)
      const lessonProgress = existing.find((p) => p.lessonId === body.lessonId)
      const blockKey = String(body.blockIndex)
      const isFirstAttempt = !lessonProgress?.quizResults?.[blockKey]

      const progress = await new SaveQuizResultsUseCase(progressRepository).execute(
        req.user.id,
        req.body,
      )

      let gamification = null
      if (req.user.profileMode === 'KIDS') {
        gamification = await gamificationEvents.onQuizResults(req.user.id, body.results, isFirstAttempt)
      }

      res.json({ ...progress, gamification })
    } catch (e) {
      next(e)
    }
  },

  async saveOpenQuestionAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const progress = await new SaveOpenQuestionAnswerUseCase(progressRepository).execute(
        req.user.id,
        req.body,
      )
      res.json(progress)
    } catch (e) {
      next(e)
    }
  },

  async saveChecklistState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const body = req.body as { lessonId: string; blockIndex: number; checked: boolean[] }
      const progress = await new SaveChecklistStateUseCase(progressRepository).execute(
        req.user.id,
        req.body,
      )

      let gamification = null
      if (req.user.profileMode === 'KIDS' && body.checked.every(Boolean) && body.checked.length > 0) {
        gamification = await gamificationEvents.onChecklistComplete(req.user.id)
      }

      res.json({ ...progress, gamification })
    } catch (e) {
      next(e)
    }
  },

  async saveGameResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const progress = await new SaveGameResultUseCase(progressRepository).execute(
        req.user.id,
        req.body,
      )
      res.json(progress)
    } catch (e) {
      next(e)
    }
  },
}
