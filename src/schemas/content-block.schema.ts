import { z } from 'zod'

export const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('TEXT'), value: z.string() }),
  z.object({
    type: z.literal('SECTION'),
    level: z.union([z.literal(1), z.literal(2)]),
    eyebrow: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
  }),
  z.object({
    type: z.literal('CALLOUT'),
    variant: z.enum(['tip', 'example', 'warning', 'note', 'exercise']),
    icon: z.string().optional(),
    title: z.string().optional(),
    value: z.string(),
  }),
  z.object({
    type: z.literal('VIDEO'),
    url: z.string(),
    title: z.string().optional(),
    isGoogleDrive: z.boolean().optional(),
    startSeconds: z.number().int().min(0).optional(),
    endSeconds: z.number().int().min(0).optional(),
  }),
  z.object({ type: z.literal('IFRAME'), url: z.string(), title: z.string().optional(), googleDocId: z.string().optional() }),
  z.object({
    type: z.literal('ACTIVITY_CHECKLIST'),
    items: z.array(z.string()),
    title: z.string().optional(),
  }),
  z.object({
    type: z.literal('QUIZ'),
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.object({ id: z.string(), text: z.string() })),
      correctOptionId: z.string(),
      explanation: z.string().optional(),
    })),
  }),
  z.object({
    type: z.literal('IMAGES'),
    images: z.array(z.object({
      id: z.string().uuid(),
      caption: z.string().optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })),
    cardWithBorder: z.boolean().optional(),
    imageLayout: z.enum(['column', 'row']).optional(),
    placeholder: z.object({
      title: z.string(),
      description: z.string(),
    }).optional(),
  }),
  z.object({
    type: z.literal('OPEN_QUESTION'),
    question: z.string(),
  }),
  z.object({
    type: z.literal('TABLE'),
    caption: z.string().optional(),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    type: z.literal('PDF'),
    src: z.string().min(1),
    title: z.string().optional(),
  }),
  z.object({
    type: z.literal('GAME'),
    gameId: z.string().uuid(),
    title: z.string().optional(),
  }),
])
