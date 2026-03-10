import sharp from 'sharp'
import { IImageRepository, ImageData } from '../../repositories/interfaces/IImageRepository'
import { AppError } from '../../middlewares/error.middleware'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const WEBP_QUALITY = 75

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

    console.log("BBBBBB")
    const webpBuffer = await sharp(file.buffer)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    const baseName = file.originalname.replace(/\.[^.]+$/, '')
    const fileName = `${baseName}.webp`

    console.log("webpBuffer",webpBuffer )
    console.log("fileName", fileName)
    console.log(" webpBuffer.length",  webpBuffer.length)
    return this.imageRepository.create({
      data: webpBuffer,
      mimeType: 'image/webp',
      fileName,
      size: webpBuffer.length,
    })
  }
}
