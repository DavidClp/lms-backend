import { IGamificationRepository } from '../../repositories/interfaces/IGamificationRepository'
import { IUserRepository } from '../../repositories/interfaces/IUserRepository'
import { XP_REWARDS, xpProgressInLevel, xpToNextLevel, LEVEL_NAMES } from '../../services/gamification.service'
import { AppError } from '../../middlewares/error.middleware'

export class GetGamificationMeUseCase {
  constructor(
    private readonly gamificationRepository: IGamificationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new AppError('Usuário não encontrado', 404)

    if (user.profileMode === 'KIDS') {
      await this.gamificationRepository.updateStreak(userId)
      await this.gamificationRepository.incrementDailyMission(userId, 'LOGIN')
    }

    const gamification = await this.gamificationRepository.findUserGamification(userId)
    if (!gamification) throw new AppError('Usuário não encontrado', 404)

    const badges = await this.gamificationRepository.findUserBadges(userId)
    const allBadges = await this.gamificationRepository.findAllBadges()
    const dailyMissions = await this.gamificationRepository.getOrCreateDailyMissions(userId, new Date())

    return {
      ...gamification,
      levelName: LEVEL_NAMES[gamification.level - 1] ?? LEVEL_NAMES[0],
      xpToNextLevel: xpToNextLevel(gamification.totalXp, gamification.level),
      xpProgressPercent: xpProgressInLevel(gamification.totalXp, gamification.level),
      badges,
      allBadges: allBadges.map((b) => ({
        ...b,
        earned: badges.some((ub) => ub.id === b.id),
      })),
      dailyMissions,
    }
  }
}

export class UpdateAvatarUseCase {
  constructor(
    private readonly gamificationRepository: IGamificationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, avatarConfig: Record<string, string>) {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new AppError('Usuário não encontrado', 404)
    if (user.profileMode !== 'KIDS') {
      throw new AppError('Avatar disponível apenas no perfil Kids', 400)
    }
    return this.gamificationRepository.updateAvatar(userId, avatarConfig as {
      skin: string
      hair: string
      accessory: string
      background: string
    })
  }
}

export class ProcessGamificationEventUseCase {
  constructor(
    private readonly gamificationRepository: IGamificationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async onMissionComplete(userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user || user.profileMode !== 'KIDS') return null

    const updated = await this.gamificationRepository.addXp(userId, XP_REWARDS.MISSION_COMPLETE)
    await this.gamificationRepository.incrementDailyMission(userId, 'COMPLETE_LESSON')

    const completedCount = await this.gamificationRepository.countCompletedLessons(userId)
    if (completedCount === 1) {
      await this.gamificationRepository.awardBadge(userId, 'first-mission')
    }

    const modulesCompleted = await this.gamificationRepository.countCompletedModules(userId)
    if (modulesCompleted >= 1) {
      await this.gamificationRepository.awardBadge(userId, 'world-complete')
    }

    if (updated.currentStreak >= 7) {
      await this.gamificationRepository.awardBadge(userId, 'streak-7')
    } else if (updated.currentStreak === 3) {
      await this.gamificationRepository.addXp(userId, XP_REWARDS.STREAK_3_BONUS)
    }

    return updated
  }

  async onQuizResults(userId: string, results: { correct: boolean }[], isFirstAttempt: boolean) {
    const user = await this.userRepository.findById(userId)
    if (!user || user.profileMode !== 'KIDS') return null

    const correctCount = results.filter((r) => r.correct).length
    if (correctCount > 0) {
      await this.gamificationRepository.incrementDailyMission(userId, 'QUIZ_CORRECT', correctCount)
    }

    const allCorrect = results.length > 0 && results.every((r) => r.correct)
    if (!allCorrect) return null

    const xp = isFirstAttempt ? XP_REWARDS.QUIZ_PERFECT_FIRST : XP_REWARDS.QUIZ_PERFECT_RETRY
    const updated = await this.gamificationRepository.addXp(userId, xp)

    const perfectCount = await this.gamificationRepository.countPerfectQuizzes(userId)
    if (perfectCount >= 5) {
      await this.gamificationRepository.awardBadge(userId, 'quiz-star')
    }

    return updated
  }

  async onChecklistComplete(userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user || user.profileMode !== 'KIDS') return null
    return this.gamificationRepository.awardBadge(userId, 'helper')
  }
}
