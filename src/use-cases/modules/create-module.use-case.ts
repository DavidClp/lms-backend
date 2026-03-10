import { z } from 'zod'
import { IModuleRepository, ModuleData, CreateModuleDTO } from '../../repositories/interfaces/IModuleRepository'
import { AppError } from '../../middlewares/error.middleware'

const createModuleSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  order: z.number().int().positive('Ordem deve ser um número positivo'),
})

export type CreateModuleInput = z.infer<typeof createModuleSchema>

export class CreateModuleUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(input: unknown): Promise<ModuleData> {
    const parsed = createModuleSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }
    return this.moduleRepository.create(parsed.data as CreateModuleDTO)
  }
}
