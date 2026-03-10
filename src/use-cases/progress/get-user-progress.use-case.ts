import {
  IProgressRepository,
  ProgressWithDetails,
} from '../../repositories/interfaces/IProgressRepository'

export class GetUserProgressUseCase {
  constructor(private readonly progressRepository: IProgressRepository) {}

  async execute(userId: string): Promise<ProgressWithDetails[]> {
    return this.progressRepository.findByUserId(userId)
  }
}
