import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IUserRepository, SafeUser } from '../../repositories/interfaces/IUserRepository'
import { IPlatformConfigRepository } from '../../repositories/interfaces/IPlatformConfigRepository'
import { AppError } from '../../middlewares/error.middleware'
import { env } from '../../config/env'

interface LoginResult {
  user: SafeUser
  token: string
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly platformConfigRepository: IPlatformConfigRepository,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const emailFormatted = email.toLowerCase()?.trim();
    const user = await this.userRepository.findByEmail(emailFormatted)

    if (!user) {
      console.log("sem user")
      throw new AppError('Credenciais inválidas - 1', 401)
    }

    const config = await this.platformConfigRepository.get()
    const shouldBypassPassword = config.disableStudentPassword && user.role === 'STUDENT'

    if (!shouldBypassPassword) {
      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        console.log("senha errada")
        throw new AppError('Credenciais inválidas - 2', 401)
      }
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    )

    const { password: _, ...safeUser } = user

    return { user: safeUser, token }
  }
}
