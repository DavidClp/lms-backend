import { Request, Response, NextFunction } from 'express'
import { LoginUseCase } from '../use-cases/auth/login.use-case'
import { userRepository } from '../repositories'

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body
      console.log("aaaa", email, password )
      const result = await new LoginUseCase(userRepository).execute(email, password)
      res.json(result)
    } catch (e) {
      next(e)
    }
  },
}
