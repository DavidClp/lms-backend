import { Request, Response, NextFunction } from 'express'
import { GetUserProgressUseCase } from '../use-cases/progress/get-user-progress.use-case'
import { ToggleProgressUseCase } from '../use-cases/progress/toggle-progress.use-case'
import { SaveQuizResultsUseCase } from '../use-cases/progress/save-quiz-results.use-case'
import { SaveOpenQuestionAnswerUseCase } from '../use-cases/progress/save-open-question-answer.use-case'
import { progressRepository, lessonRepository } from '../repositories'
import { AppError } from '../middlewares/error.middleware'

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
      const progress = await new ToggleProgressUseCase(
        progressRepository,
        lessonRepository,
      ).execute(req.user.id, req.body)
      res.json(progress)
    } catch (e) {
      next(e)
    }
  },

  async saveQuizResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Não autenticado', 401)
      }
      const progress = await new SaveQuizResultsUseCase(progressRepository).execute(
        req.user.id,
        req.body
      )
      res.json(progress)
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
        req.body
      )
      res.json(progress)
    } catch (e) {
      next(e)
    }
  },
}
