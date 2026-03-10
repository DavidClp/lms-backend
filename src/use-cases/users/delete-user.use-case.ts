import { IUserRepository } from '../../repositories/interfaces/IUserRepository'
import { AppError } from '../../middlewares/error.middleware'

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id)
    if (!existing) throw new AppError('Usuário não encontrado', 404)
    await this.userRepository.delete(id)
  }
}
