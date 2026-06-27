import { z } from 'zod'

export const wordSearchInputSchema = z.object({
  words: z.array(z.string().min(1)).min(2).max(15),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  allowDiagonal: z.boolean().optional(),
  allowBackwards: z.boolean().optional(),
  timeLimitSeconds: z.number().int().positive().nullable().optional(),
  gridSize: z.number().int().min(6).max(16).nullable().optional(),
})

export const hangmanInputSchema = z.object({
  secretWord: z.string().min(3).max(20),
  hint: z.string().min(3).max(200),
  category: z.string().max(50).nullable().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  maxWrongGuesses: z.number().int().min(3).max(12).nullable().optional(),
})

export const createGameSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('WORD_SEARCH'),
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    config: wordSearchInputSchema,
  }),
  z.object({
    type: z.literal('HANGMAN'),
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    config: hangmanInputSchema,
  }),
])

export const updateGameSchema = z.object({
  type: z.enum(['WORD_SEARCH', 'HANGMAN']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  config: z.union([wordSearchInputSchema, hangmanInputSchema]).optional(),
  regenerateGrid: z.boolean().optional(),
})
