import { Request, Response, NextFunction } from 'express'
import {
  GetGamificationMeUseCase,
  UpdateAvatarUseCase,
} from '../use-cases/gamification/gamification.use-cases'
import { gamificationRepository, userRepository } from '../repositories'
import { AppError } from '../middlewares/error.middleware'

export const gamificationController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Não autenticado', 401)
      const data = await new GetGamificationMeUseCase(gamificationRepository, userRepository).execute(
        req.user.id,
      )
      res.json(data)
    } catch (e) {
      next(e)
    }
  },

  async updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Não autenticado', 401)
      const data = await new UpdateAvatarUseCase(gamificationRepository, userRepository).execute(
        req.user.id,
        req.body,
      )
      res.json(data)
    } catch (e) {
      next(e)
    }
  },
}
