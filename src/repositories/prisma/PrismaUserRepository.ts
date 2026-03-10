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
  createdAt: true,
  updatedAt: true,
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    })
    return users.map((u) => ({ ...u, role: u.role as 'ADMIN' | 'STUDENT' }))
  }

  async findById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    })
    if (!user) return null
    return { ...user, role: user.role as 'ADMIN' | 'STUDENT' }
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })
    if (!user) return null
    return { ...user, role: user.role as 'ADMIN' | 'STUDENT' }
  }

  async create(data: CreateUserDTO): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role ?? 'STUDENT',
      },
      select: safeUserSelect,
    })
    return { ...user, role: user.role as 'ADMIN' | 'STUDENT' }
  }

  async update(id: string, data: UpdateUserDTO): Promise<SafeUser> {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: safeUserSelect,
    })
    return { ...user, role: user.role as 'ADMIN' | 'STUDENT' }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }
}
