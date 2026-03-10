import { z } from 'zod'
import { IUserRepository, SafeUser } from '../../repositories/interfaces/IUserRepository'
import { AppError } from '../../middlewares/error.middleware'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'STUDENT']).optional(),
})

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, input: unknown): Promise<SafeUser> {
    const existing = await this.userRepository.findById(id)
    if (!existing) throw new AppError('Usuário não encontrado', 404)

    const parsed = updateUserSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(parsed.data.email)
      if (emailTaken) throw new AppError('Email já cadastrado', 409)
    }

    return this.userRepository.update(id, parsed.data)
  }
}
