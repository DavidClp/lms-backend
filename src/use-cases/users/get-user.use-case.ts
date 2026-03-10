import { IUserRepository, SafeUser } from '../../repositories/interfaces/IUserRepository'
import { AppError } from '../../middlewares/error.middleware'

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(id)
    if (!user) throw new AppError('Usuário não encontrado', 404)
    return user
  }
}
