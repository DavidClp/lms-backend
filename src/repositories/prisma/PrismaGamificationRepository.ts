import { PrismaClient, DailyMissionType } from '@prisma/client'
import {
  IGamificationRepository,
  BadgeData,
  UserBadgeData,
  DailyMissionData,
  GamificationUserData,
} from '../interfaces/IGamificationRepository'
import { calculateLevel, DEFAULT_AVATAR, type AvatarConfig, XP_REWARDS } from '../../services/gamification.service'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function mapUser(u: {
  id: string
  profileMode: string
  totalXp: number
  level: number
  avatarConfig: unknown
  currentStreak: number
  lastActivityDate: Date | null
}): GamificationUserData {
  return {
    id: u.id,
    profileMode: u.profileMode as 'ADULT' | 'KIDS',
    totalXp: u.totalXp,
    level: u.level,
    avatarConfig: (u.avatarConfig as AvatarConfig | null) ?? null,
    currentStreak: u.currentStreak,
    lastActivityDate: u.lastActivityDate,
  }
}

export class PrismaGamificationRepository implements IGamificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserGamification(userId: string): Promise<GamificationUserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profileMode: true,
        totalXp: true,
        level: true,
        avatarConfig: true,
        currentStreak: true,
        lastActivityDate: true,
      },
    })
    return user ? mapUser(user) : null
  }

  async addXp(userId: string, amount: number): Promise<GamificationUserData> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    const totalXp = user.totalXp + amount
    const level = calculateLevel(totalXp)
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { totalXp, level },
      select: {
        id: true,
        profileMode: true,
        totalXp: true,
        level: true,
        avatarConfig: true,
        currentStreak: true,
        lastActivityDate: true,
      },
    })
    return mapUser(updated)
  }

  async updateAvatar(userId: string, avatarConfig: AvatarConfig): Promise<GamificationUserData> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarConfig: avatarConfig as object },
      select: {
        id: true,
        profileMode: true,
        totalXp: true,
        level: true,
        avatarConfig: true,
        currentStreak: true,
        lastActivityDate: true,
      },
    })
    return mapUser(updated)
  }

  async updateStreak(userId: string): Promise<GamificationUserData> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const today = startOfDay(new Date())
    const last = user.lastActivityDate ? startOfDay(user.lastActivityDate) : null
    let currentStreak = user.currentStreak

    if (!last) {
      currentStreak = 1
    } else {
      const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) {
        // same day, keep streak
      } else if (diffDays === 1) {
        currentStreak += 1
      } else {
        currentStreak = 1
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { currentStreak, lastActivityDate: new Date() },
      select: {
        id: true,
        profileMode: true,
        totalXp: true,
        level: true,
        avatarConfig: true,
        currentStreak: true,
        lastActivityDate: true,
      },
    })
    return mapUser(updated)
  }

  async findAllBadges(): Promise<BadgeData[]> {
    return this.prisma.badge.findMany({ orderBy: { createdAt: 'asc' } })
  }

  async findUserBadges(userId: string): Promise<UserBadgeData[]> {
    const records = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    })
    return records.map((r) => ({ ...r.badge, earnedAt: r.earnedAt }))
  }

  async awardBadge(userId: string, slug: string): Promise<UserBadgeData | null> {
    const badge = await this.prisma.badge.findUnique({ where: { slug } })
    if (!badge) return null

    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    })
    if (existing) {
      return { ...badge, earnedAt: existing.earnedAt }
    }

    const record = await this.prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
      include: { badge: true },
    })

    if (badge.xpReward > 0) {
      await this.addXp(userId, badge.xpReward)
    }

    return { ...record.badge, earnedAt: record.earnedAt }
  }

  async hasBadge(userId: string, slug: string): Promise<boolean> {
    const badge = await this.prisma.badge.findUnique({ where: { slug } })
    if (!badge) return false
    const record = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    })
    return !!record
  }

  async getOrCreateDailyMissions(userId: string, date: Date): Promise<DailyMissionData[]> {
    const day = startOfDay(date)
    const templates: { type: DailyMissionType; target: number; xpReward: number }[] = [
      { type: 'LOGIN', target: 1, xpReward: XP_REWARDS.DAILY_LOGIN },
      { type: 'COMPLETE_LESSON', target: 1, xpReward: XP_REWARDS.DAILY_LESSON },
      { type: 'QUIZ_CORRECT', target: 3, xpReward: XP_REWARDS.DAILY_QUIZ },
    ]

    for (const t of templates) {
      await this.prisma.dailyMission.upsert({
        where: {
          userId_date_type: { userId, date: day, type: t.type },
        },
        create: {
          userId,
          date: day,
          type: t.type,
          target: t.target,
          xpReward: t.xpReward,
        },
        update: {},
      })
    }

    return this.prisma.dailyMission.findMany({
      where: { userId, date: day },
      orderBy: { type: 'asc' },
    })
  }

  async incrementDailyMission(
    userId: string,
    type: DailyMissionData['type'],
    amount = 1
  ): Promise<DailyMissionData[]> {
    const day = startOfDay(new Date())
    await this.getOrCreateDailyMissions(userId, day)

    const mission = await this.prisma.dailyMission.findUnique({
      where: { userId_date_type: { userId, date: day, type } },
    })

    if (mission && !mission.completed) {
      const progress = Math.min(mission.target, mission.progress + amount)
      const completed = progress >= mission.target
      await this.prisma.dailyMission.update({
        where: { id: mission.id },
        data: { progress, completed },
      })
      if (completed && mission.xpReward > 0) {
        await this.addXp(userId, mission.xpReward)
      }
    }

    return this.getOrCreateDailyMissions(userId, day)
  }

  async countCompletedLessons(userId: string): Promise<number> {
    return this.prisma.progress.count({ where: { userId, completed: true } })
  }

  async countPerfectQuizzes(userId: string): Promise<number> {
    const records = await this.prisma.progress.findMany({
      where: { userId },
      select: { quizResults: true },
    })
    let count = 0
    for (const r of records) {
      if (!r.quizResults || typeof r.quizResults !== 'object') continue
      for (const attempts of Object.values(r.quizResults as Record<string, unknown>)) {
        if (!Array.isArray(attempts)) continue
        const last = Array.isArray(attempts[0]) ? attempts[attempts.length - 1] : attempts
        if (Array.isArray(last) && last.length > 0 && last.every((q: { correct?: boolean }) => q.correct)) {
          count++
          break
        }
      }
    }
    return count
  }

  async countCompletedModules(userId: string): Promise<number> {
    const modules = await this.prisma.module.findMany({
      include: { lessons: { where: { isActive: true } } },
    })
    const progress = await this.prisma.progress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
    })
    const completedIds = new Set(progress.map((p) => p.lessonId))
    let count = 0
    for (const mod of modules) {
      if (mod.lessons.length === 0) continue
      if (mod.lessons.every((l) => completedIds.has(l.id))) count++
    }
    return count
  }
}

export { DEFAULT_AVATAR }
