export interface SafeUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STUDENT'
  createdAt: Date
  updatedAt: Date
}

export interface UserWithPassword extends SafeUser {
  password: string
}

export interface CreateUserDTO {
  name: string
  email: string
  password: string
  role?: 'ADMIN' | 'STUDENT'
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
  role?: 'ADMIN' | 'STUDENT'
}

export interface IUserRepository {
  findAll(): Promise<SafeUser[]>
  findById(id: string): Promise<SafeUser | null>
  findByEmail(email: string): Promise<UserWithPassword | null>
  create(data: CreateUserDTO): Promise<SafeUser>
  update(id: string, data: UpdateUserDTO): Promise<SafeUser>
  delete(id: string): Promise<void>
}
