export interface ImageData {
  id: string
  data: Buffer
  mimeType: string
  fileName: string
  size: number
  createdAt: Date
}

export interface CreateImageDTO {
  data: Buffer
  mimeType: string
  fileName: string
  size: number
}

export interface IImageRepository {
  create(data: CreateImageDTO): Promise<ImageData>
  findById(id: string): Promise<ImageData | null>
  deleteById(id: string): Promise<void>
}
