import type { AvatarConfig } from '../../services/gamification.service'

export interface BadgeData {
  id: string
  slug: string
  name: string
  description: string
  iconEmoji: string
  xpReward: number
  createdAt: Date
}

export interface UserBadgeData extends BadgeData {
  earnedAt: Date
}

export interface DailyMissionData {
  id: string
  userId: string
  date: Date
  type: 'LOGIN' | 'COMPLETE_LESSON' | 'QUIZ_CORRECT'
  target: number
  progress: number
  completed: boolean
  xpReward: number
}

export interface GamificationUserData {
  id: string
  profileMode: 'ADULT' | 'KIDS'
  totalXp: number
  level: number
  avatarConfig: AvatarConfig | null
  currentStreak: number
  lastActivityDate: Date | null
}

export interface IGamificationRepository {
  findUserGamification(userId: string): Promise<GamificationUserData | null>
  addXp(userId: string, amount: number): Promise<GamificationUserData>
  updateAvatar(userId: string, avatarConfig: AvatarConfig): Promise<GamificationUserData>
  updateStreak(userId: string): Promise<GamificationUserData>
  findAllBadges(): Promise<BadgeData[]>
  findUserBadges(userId: string): Promise<UserBadgeData[]>
  awardBadge(userId: string, slug: string): Promise<UserBadgeData | null>
  hasBadge(userId: string, slug: string): Promise<boolean>
  getOrCreateDailyMissions(userId: string, date: Date): Promise<DailyMissionData[]>
  incrementDailyMission(
    userId: string,
    type: DailyMissionData['type'],
    amount?: number
  ): Promise<DailyMissionData[]>
  countCompletedLessons(userId: string): Promise<number>
  countPerfectQuizzes(userId: string): Promise<number>
  countCompletedModules(userId: string): Promise<number>
}
