import { Request, Response, NextFunction } from 'express'
import { ListUsersUseCase } from '../use-cases/users/list-users.use-case'
import { GetUserUseCase } from '../use-cases/users/get-user.use-case'
import { CreateUserUseCase } from '../use-cases/users/create-user.use-case'
import { UpdateUserUseCase } from '../use-cases/users/update-user.use-case'
import { DeleteUserUseCase } from '../use-cases/users/delete-user.use-case'
import { GetStudentModuleAccessUseCase } from '../use-cases/module-access/get-student-module-access.use-case'
import { UpdateStudentModuleAccessUseCase } from '../use-cases/module-access/update-student-module-access.use-case'
import { userRepository, studentModuleAccessRepository } from '../repositories'
import { AppError } from '../middlewares/error.middleware'

export const userController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await new ListUsersUseCase(userRepository).execute()
      res.json(users)
    } catch (e) {
      next(e)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await new GetUserUseCase(userRepository).execute(req.params.id)
      res.json(user)
    } catch (e) {
      next(e)
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await new CreateUserUseCase(userRepository).execute(req.body)
      res.status(201).json(user)
    } catch (e) {
      next(e)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await new UpdateUserUseCase(userRepository).execute(req.params.id, req.body)
      res.json(user)
    } catch (e) {
      next(e)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await new DeleteUserUseCase(userRepository).execute(req.params.id)
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  },

  async getModuleAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      if (!req.user) {
        throw new AppError('Não autorizado', 401)
      }
      if (req.user.role !== 'ADMIN' && req.user.id !== id) {
        throw new AppError('Acesso negado', 403)
      }
      const result = await new GetStudentModuleAccessUseCase(studentModuleAccessRepository).execute(id)
      res.json(result)
    } catch (e) {
      next(e)
    }
  },

  async updateModuleAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { moduleIds } = req.body as { moduleIds?: string[] }
      if (!Array.isArray(moduleIds)) {
        throw new AppError('moduleIds deve ser um array', 400)
      }
      const result = await new UpdateStudentModuleAccessUseCase(studentModuleAccessRepository).execute(id, moduleIds)
      res.json(result)
    } catch (e) {
      next(e)
    }
  },
}
