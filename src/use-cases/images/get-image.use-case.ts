import { IImageRepository, ImageData } from '../../repositories/interfaces/IImageRepository'
import { AppError } from '../../middlewares/error.middleware'

export class GetImageUseCase {
  constructor(private readonly imageRepository: IImageRepository) {}

  async execute(id: string): Promise<ImageData> {
    const image = await this.imageRepository.findById(id)
    if (!image) throw new AppError('Imagem não encontrada', 404)
    return image
  }
}
