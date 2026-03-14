export interface IStudentModuleAccessRepository {
  getModuleIdsByUserId(userId: string): Promise<string[]>
  setModulesForUser(userId: string, moduleIds: string[]): Promise<void>
}
