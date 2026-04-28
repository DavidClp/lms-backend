import { NextFunction, Request, Response } from 'express'
import { platformConfigRepository } from '../repositories'
import { GetPlatformConfigUseCase } from '../use-cases/platform-config/get-platform-config.use-case'
import { UpdatePlatformConfigUseCase } from '../use-cases/platform-config/update-platform-config.use-case'

export const platformConfigController = {
  async get(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await new GetPlatformConfigUseCase(platformConfigRepository).execute()
      res.json(result)
    } catch (e) {
      next(e)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { disableStudentPassword } = req.body as { disableStudentPassword?: unknown }
      const result = await new UpdatePlatformConfigUseCase(platformConfigRepository).execute(disableStudentPassword)
      res.json(result)
    } catch (e) {
      next(e)
    }
  },
}
