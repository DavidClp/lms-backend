import { z } from 'zod'
import { IUserRepository, SafeUser } from '../../repositories/interfaces/IUserRepository'
import { AppError } from '../../middlewares/error.middleware'

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'STUDENT']).optional(),
})

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: unknown): Promise<SafeUser> {
    const parsed = createUserSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    const existing = await this.userRepository.findByEmail(parsed.data.email)
    if (existing) throw new AppError('Email já cadastrado', 409)

    return this.userRepository.create(parsed.data)
  }
}
