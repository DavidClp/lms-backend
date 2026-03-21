import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { UploadImageUseCase } from '../use-cases/images/upload-image.use-case'
import { GetImageUseCase } from '../use-cases/images/get-image.use-case'
import { imageRepository } from '../repositories'

const storage = multer.memoryStorage()
export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
})

export const imageController = {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        res.status(400).json({ message: 'Nenhum arquivo enviado.' })
        return
      }

      const useCase = new UploadImageUseCase(imageRepository)
      const results = await Promise.all(
        files.map((file) =>
          useCase.execute({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          })
        )
      )

      res.status(201).json(
        results.map((img) => ({
          id: img.id,
          fileName: img.fileName,
          size: img.size,
          mimeType: img.mimeType,
        }))
      )
    } catch (e) {
      console.log("EEEE", e)
      next(e)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const image = await new GetImageUseCase(imageRepository).execute(req.params.id)
      res.setHeader('Content-Type', image.mimeType)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.send(image.data)
    } catch (e) {
      next(e)
    }
  },
}
