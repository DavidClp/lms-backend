import { Request, Response, NextFunction } from 'express'
import { LoginUseCase } from '../use-cases/auth/login.use-case'
import { RegisterStudentUseCase } from '../use-cases/auth/register-student.use-case'
import { moduleRepository, platformConfigRepository, studentModuleAccessRepository, userRepository } from '../repositories'

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body
      console.log("aaaa", email, password )
      const result = await new LoginUseCase(userRepository, platformConfigRepository).execute(email, password)
      res.json(result)
    } catch (e) {
      next(e)
    }
  },

  async registerStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await new RegisterStudentUseCase(
        userRepository,
        moduleRepository,
        studentModuleAccessRepository,
      ).execute(req.body)
      res.status(201).json(result)
    } catch (e) {
      next(e)
    }
  },
}
