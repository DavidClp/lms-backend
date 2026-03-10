export interface ModuleData {
  id: string
  title: string
  description: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface ModuleWithCount extends ModuleData {
  lessonsCount: number
}

export interface CreateModuleDTO {
  title: string
  description?: string
  order: number
}

export interface UpdateModuleDTO {
  title?: string
  description?: string
  order?: number
}

export interface IModuleRepository {
  findAll(): Promise<ModuleWithCount[]>
  findById(id: string): Promise<ModuleData | null>
  create(data: CreateModuleDTO): Promise<ModuleData>
  update(id: string, data: UpdateModuleDTO): Promise<ModuleData>
  delete(id: string): Promise<void>
}
