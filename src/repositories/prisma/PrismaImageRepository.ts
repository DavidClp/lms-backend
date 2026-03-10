import { PrismaClient } from '@prisma/client'
import { IImageRepository, ImageData, CreateImageDTO } from '../interfaces/IImageRepository'

export class PrismaImageRepository implements IImageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateImageDTO): Promise<ImageData> {
    const image = await this.prisma.image.create({
      data: {
        data: data.data,
        mimeType: data.mimeType,
        fileName: data.fileName,
        size: data.size,
      },
    })

    console.log("imagem", image)
    return {
      ...image,
      data: Buffer.from(image.data),
    }
  }

  async findById(id: string): Promise<ImageData | null> {
    const image = await this.prisma.image.findUnique({ where: { id } })
    if (!image) return null
    return {
      ...image,
      data: Buffer.from(image.data),
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.image.delete({ where: { id } })
  }
}
