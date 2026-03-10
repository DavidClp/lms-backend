import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IUserRepository, SafeUser } from '../../repositories/interfaces/IUserRepository'
import { AppError } from '../../middlewares/error.middleware'
import { env } from '../../config/env'

interface LoginResult {
  user: SafeUser
  token: string
}

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      console.log("sem user")
      throw new AppError('Credenciais inválidas', 401)
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
           console.log("senah errada")
      throw new AppError('Credenciais inválidas', 401)
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
