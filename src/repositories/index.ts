import { prisma } from '../config/prisma'
import { PrismaUserRepository } from './prisma/PrismaUserRepository'
import { PrismaModuleRepository } from './prisma/PrismaModuleRepository'
import { PrismaLessonRepository } from './prisma/PrismaLessonRepository'
import { PrismaProgressRepository } from './prisma/PrismaProgressRepository'
import { PrismaImageRepository } from './prisma/PrismaImageRepository'

export const userRepository = new PrismaUserRepository(prisma)
export const moduleRepository = new PrismaModuleRepository(prisma)
export const lessonRepository = new PrismaLessonRepository(prisma)
export const progressRepository = new PrismaProgressRepository(prisma)
export const imageRepository = new PrismaImageRepository(prisma)
