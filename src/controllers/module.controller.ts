import { Request, Response, NextFunction } from 'express'
import { ListModulesUseCase } from '../use-cases/modules/list-modules.use-case'
import { GetModuleUseCase } from '../use-cases/modules/get-module.use-case'
import { CreateModuleUseCase } from '../use-cases/modules/create-module.use-case'
import { UpdateModuleUseCase } from '../use-cases/modules/update-module.use-case'
import { DeleteModuleUseCase } from '../use-cases/modules/delete-module.use-case'
import { moduleRepository } from '../repositories'

export const moduleController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const modules = await new ListModulesUseCase(moduleRepository).execute()
      res.json(modules)
    } catch (e) {
      next(e)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const module = await new GetModuleUseCase(moduleRepository).execute(req.params.id)
      res.json(module)
    } catch (e) {
      next(e)
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const module = await new CreateModuleUseCase(moduleRepository).execute(req.body)
      res.status(201).json(module)
    } catch (e) {
      next(e)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const module = await new UpdateModuleUseCase(moduleRepository).execute(req.params.id, req.body)
      res.json(module)
    } catch (e) {
      next(e)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await new DeleteModuleUseCase(moduleRepository).execute(req.params.id)
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  },
}
