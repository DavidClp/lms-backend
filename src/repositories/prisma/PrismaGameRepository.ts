import { PrismaClient } from '@prisma/client'
import type { WordSearchConfig } from '../../services/word-search.service'
import type { HangmanConfig } from '../../services/hangman.service'
import {
  IGameRepository,
  GameData,
  GameWithProgress,
  CreateGameDTO,
  UpdateGameDTO,
  GameProgressData,
  GameDifficulty,
  GameType,
  GameConfig,
} from '../interfaces/IGameRepository'

function mapGame(g: {
  id: string
  title: string
  description: string | null
  type: string
  difficulty: string
  config: unknown
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}): GameData {
  return {
    ...g,
    type: g.type as GameType,
    difficulty: g.difficulty as GameDifficulty,
    config: g.config as GameConfig,
  }
}

export class PrismaGameRepository implements IGameRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(includeInactive = false): Promise<GameData[]> {
    const games = await this.prisma.game.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
    return games.map(mapGame)
  }

  async findById(id: string): Promise<GameData | null> {
    const game = await this.prisma.game.findUnique({ where: { id } })
    return game ? mapGame(game) : null
  }

  async create(data: CreateGameDTO): Promise<GameData> {
    const game = await this.prisma.game.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        type: (data.type ?? 'WORD_SEARCH') as GameType,
        difficulty: data.difficulty,
        config: data.config as object,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
      },
    })
    return mapGame(game)
  }

  async update(id: string, data: UpdateGameDTO): Promise<GameData> {
    const game = await this.prisma.game.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        config: data.config ? (data.config as object) : undefined,
        isActive: data.isActive,
        order: data.order,
      },
    })
    return mapGame(game)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.game.delete({ where: { id } })
  }

  async findProgress(userId: string, gameId: string): Promise<GameProgressData | null> {
    const p = await this.prisma.gameProgress.findUnique({
      where: { userId_gameId: { userId, gameId } },
    })
    if (!p) return null
    return {
      id: p.id,
      userId: p.userId,
      gameId: p.gameId,
      completed: p.completed,
      completedAt: p.completedAt,
      stats: (p.stats as Record<string, unknown>) ?? null,
    }
  }

  async upsertProgress(
    userId: string,
    gameId: string,
    data: { completed: boolean; stats?: Record<string, unknown> },
  ): Promise<GameProgressData> {
    const completedAt = data.completed ? new Date() : null
    const p = await this.prisma.gameProgress.upsert({
      where: { userId_gameId: { userId, gameId } },
      create: {
        userId,
        gameId,
        completed: data.completed,
        completedAt,
        stats: data.stats ? (data.stats as object) : undefined,
      },
      update: {
        completed: data.completed,
        completedAt,
        stats: data.stats ? (data.stats as object) : undefined,
      },
    })
    return {
      id: p.id,
      userId: p.userId,
      gameId: p.gameId,
      completed: p.completed,
      completedAt: p.completedAt,
      stats: (p.stats as Record<string, unknown>) ?? null,
    }
  }

  async findAllWithUserProgress(userId: string, includeInactive = false): Promise<GameWithProgress[]> {
    const games = await this.prisma.game.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        progress: {
          where: { userId },
          take: 1,
        },
      },
    })

    return games.map(({ progress, ...g }) => {
      const userProgress = progress[0]
      return {
        ...mapGame(g),
        userProgress: userProgress
          ? {
              completed: userProgress.completed,
              completedAt: userProgress.completedAt,
              stats: (userProgress.stats as Record<string, unknown>) ?? null,
            }
          : null,
      }
    })
  }
}
