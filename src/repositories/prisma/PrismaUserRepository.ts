import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  IUserRepository,
  SafeUser,
  UserWithPassword,
  CreateUserDTO,
  UpdateUserDTO,
} from '../interfaces/IUserRepository'

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileMode: true,
  totalXp: true,
  level: true,
  avatarConfig: true,
  currentStreak: true,
  lastActivityDate: true,
  createdAt: true,
  updatedAt: true,
}

function mapUser(u: {
  id: string
  name: string
  email: string
  role: string
  profileMode: string
  totalXp: number
  level: number
  avatarConfig: unknown
  currentStreak: number
  lastActivityDate: Date | null
  createdAt: Date
  updatedAt: Date
}): SafeUser {
  return {
    ...u,
    role: u.role as 'ADMIN' | 'STUDENT',
    profileMode: u.profileMode as 'ADULT' | 'KIDS',
    avatarConfig: (u.avatarConfig as Record<string, string> | null) ?? null,
  }
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    })
    return users.map(mapUser)
  }

  async findById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    })
    if (!user) return null
    return mapUser(user)
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })
    if (!user) return null
    return {
      ...mapUser(user),
      password: user.password,
    }
  }

  async create(data: CreateUserDTO): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role ?? 'STUDENT',
        profileMode: data.profileMode ?? 'ADULT',
      },
      select: safeUserSelect,
    })
    return mapUser(user)
  }

  async update(id: string, data: UpdateUserDTO): Promise<SafeUser> {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.profileMode !== undefined) updateData.profileMode = data.profileMode
    if (data.avatarConfig !== undefined) updateData.avatarConfig = data.avatarConfig
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: safeUserSelect,
    })
    return mapUser(user)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userBadge.deleteMany({ where: { userId: id } })
      await tx.dailyMission.deleteMany({ where: { userId: id } })
      await tx.studentModuleAccess.deleteMany({ where: { userId: id } })
      await tx.progress.deleteMany({ where: { userId: id } })
      await tx.user.delete({ where: { id } })
    })
  }
}
