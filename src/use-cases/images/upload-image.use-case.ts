import sharp from 'sharp'
import { IImageRepository, ImageData } from '../../repositories/interfaces/IImageRepository'
import { AppError } from '../../middlewares/error.middleware'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/avif']
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
const WEBP_QUALITY = 100

export interface UploadImageInput {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

export class UploadImageUseCase {
  constructor(private readonly imageRepository: IImageRepository) {}

  async execute(file: UploadImageInput): Promise<ImageData> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError('Tipo de arquivo não suportado. Envie uma imagem (JPEG, PNG, GIF, WebP, BMP, TIFF).', 400)
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new AppError('Arquivo muito grande. Tamanho máximo: 10 MB.', 400)
    }

    const isGif = file.mimetype === 'image/gif'
    let data: Buffer
    let mimeType: string
    let fileName: string
    const baseName = file.originalname.replace(/\.[^.]+$/, '')

    if (isGif) {
      data = file.buffer
      mimeType = 'image/gif'
      fileName = `${baseName}.gif`
    } else {
      data = await sharp(file.buffer)
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
      mimeType = 'image/webp'
      fileName = `${baseName}.webp`
    }

    return this.imageRepository.create({
      data,
      mimeType,
      fileName,
      size: data.length,
    })
  }
}
