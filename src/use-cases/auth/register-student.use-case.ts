import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { AppError } from '../../middlewares/error.middleware'
import { env } from '../../config/env'
import { IUserRepository, SafeUser } from '../../repositories/interfaces/IUserRepository'
import { IModuleRepository } from '../../repositories/interfaces/IModuleRepository'
import { IStudentModuleAccessRepository } from '../../repositories/interfaces/IStudentModuleAccessRepository'

interface RegisterStudentResult {
  user: SafeUser
  token: string
}

const registerStudentSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  email: z.string().trim().email('Email inválido'),
})

export class RegisterStudentUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly studentModuleAccessRepository: IStudentModuleAccessRepository,
  ) {}

  async execute(input: unknown): Promise<RegisterStudentResult> {
    const parsed = registerStudentSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    const email = parsed.data.email.toLowerCase()
    const existing = await this.userRepository.findByEmail(email)
    if (existing) {
      throw new AppError('Email já cadastrado', 409)
    }

    const emailPrefix = email.split('@')[0]
    const generatedPassword = `aluno${emailPrefix}`

    const user = await this.userRepository.create({
      name: parsed.data.name,
      email,
      password: generatedPassword,
      role: 'STUDENT',
    })
    const allModules = await this.moduleRepository.findAll()
    const allModuleIds = allModules.map((module) => module.id)
    await this.studentModuleAccessRepository.setModulesForUser(user.id, allModuleIds)

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    )

    return { user, token }
  }
}
