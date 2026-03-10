import { IUserRepository, SafeUser } from '../../repositories/interfaces/IUserRepository'

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<SafeUser[]> {
    return this.userRepository.findAll()
  }
}
