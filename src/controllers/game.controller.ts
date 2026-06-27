import { Request, Response, NextFunction } from 'express'
import { ListGamesUseCase, GetGameUseCase } from '../use-cases/games/list-games.use-case'
import { CreateGameUseCase } from '../use-cases/games/create-game.use-case'
import { UpdateGameUseCase } from '../use-cases/games/update-game.use-case'
import { RegenerateGameGridUseCase } from '../use-cases/games/regenerate-game.use-case'
import { DeleteGameUseCase } from '../use-cases/games/delete-game.use-case'
import { CompleteGameUseCase } from '../use-cases/games/complete-game.use-case'
import { ProcessGamificationEventUseCase } from '../use-cases/gamification/gamification.use-cases'
import { gameRepository, gamificationRepository, userRepository } from '../repositories'
import { AppError } from '../middlewares/error.middleware'

const listGames = new ListGamesUseCase(gameRepository)
const getGame = new GetGameUseCase(gameRepository)
const createGame = new CreateGameUseCase(gameRepository)
const updateGame = new UpdateGameUseCase(gameRepository)
const regenerateGame = new RegenerateGameGridUseCase(gameRepository)
const deleteGame = new DeleteGameUseCase(gameRepository)
const completeGame = new CompleteGameUseCase(gameRepository)
const gamificationEvents = new ProcessGamificationEventUseCase(gamificationRepository, userRepository)

export const gameController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Não autenticado', 401)
      const isAdmin = req.user.role === 'ADMIN'
      const games = await listGames.execute(req.user.id, isAdmin)
      res.json(games)
    } catch (e) {
      next(e)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Não autenticado', 401)
      const isAdmin = req.user.role === 'ADMIN'
      const game = await getGame.execute(req.params.id, req.user.id, isAdmin)
      res.json(game)
    } catch (e) {
      next(e)
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await createGame.execute(req.body)
      res.status(201).json(game)
    } catch (e) {
      next(e)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await updateGame.execute(req.params.id, req.body)
      res.json(game)
    } catch (e) {
      next(e)
    }
  },

  async regenerate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const game = await regenerateGame.execute(req.params.id)
      res.json(game)
    } catch (e) {
      next(e)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await deleteGame.execute(req.params.id)
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  },

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Não autenticado', 401)
      if (req.user.profileMode !== 'KIDS') {
        throw new AppError('Jogos disponíveis apenas no perfil Kids', 403)
      }

      const { progress, wasAlreadyCompleted } = await completeGame.execute(
        req.user.id,
        req.params.id,
        req.body,
      )

      let gamification = null
      if (!wasAlreadyCompleted) {
        gamification = await gamificationEvents.onGameComplete(req.user.id)
      }

      res.json({ progress, gamification, xpEarned: wasAlreadyCompleted ? 0 : 15 })
    } catch (e) {
      next(e)
    }
  },
}
