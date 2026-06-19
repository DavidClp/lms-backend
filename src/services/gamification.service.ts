/** XP thresholds for levels 1-5 */
export const LEVEL_THRESHOLDS = [0, 150, 400, 800, 1500] as const

export const LEVEL_NAMES = [
  'Explorador',
  'Aprendiz',
  'Detetive Digital',
  'Mestre do Teclado',
  'Campeão Tech',
] as const

export const XP_REWARDS = {
  MISSION_COMPLETE: 50,
  QUIZ_PERFECT_FIRST: 20,
  QUIZ_PERFECT_RETRY: 10,
  DAILY_LOGIN: 10,
  DAILY_LESSON: 30,
  DAILY_QUIZ: 20,
  WEEKLY_LESSONS: 100,
  STREAK_3_BONUS: 25,
} as const

export function calculateLevel(totalXp: number): number {
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  return Math.min(level, LEVEL_NAMES.length)
}

export function xpToNextLevel(totalXp: number, level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return 0
  return LEVEL_THRESHOLDS[level] - totalXp
}

export function xpProgressInLevel(totalXp: number, level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const range = nextThreshold - currentThreshold
  if (range <= 0) return 100
  return Math.min(100, Math.round(((totalXp - currentThreshold) / range) * 100))
}

export interface AvatarConfig {
  skin: string
  hair: string
  accessory: string
  background: string
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 'peach',
  hair: 'brown',
  accessory: 'none',
  background: 'sky',
}
