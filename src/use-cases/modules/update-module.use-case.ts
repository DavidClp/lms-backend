import { z } from 'zod'
import { IModuleRepository, ModuleData } from '../../repositories/interfaces/IModuleRepository'
import { AppError } from '../../middlewares/error.middleware'

const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().positive().optional(),
})

export class UpdateModuleUseCase {
  constructor(private readonly moduleRepository: IModuleRepository) {}

  async execute(id: string, input: unknown): Promise<ModuleData> {
    const existing = await this.moduleRepository.findById(id)
    if (!existing) throw new AppError('Módulo não encontrado', 404)

    const parsed = updateModuleSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400)
    }

    return this.moduleRepository.update(id, parsed.data)
  }
}
