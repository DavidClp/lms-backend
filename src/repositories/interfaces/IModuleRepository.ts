export type ModuleAudience = 'ADULT' | 'KIDS' | 'ALL'

export interface KidsMeta {
  worldIcon?: string
  worldColor?: string
  mascotIntro?: string
}

export interface ModuleData {
  id: string
  title: string
  description: string | null
  order: number
  audience: ModuleAudience
  kidsMeta: KidsMeta | null
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
  audience?: ModuleAudience
  kidsMeta?: KidsMeta
}

export interface UpdateModuleDTO {
  title?: string
  description?: string
  order?: number
  audience?: ModuleAudience
  kidsMeta?: KidsMeta
}

export interface IModuleRepository {
  findAll(audienceFilter?: ModuleAudience[]): Promise<ModuleWithCount[]>
  findById(id: string): Promise<ModuleData | null>
  create(data: CreateModuleDTO): Promise<ModuleData>
  update(id: string, data: UpdateModuleDTO): Promise<ModuleData>
  delete(id: string): Promise<void>
}
