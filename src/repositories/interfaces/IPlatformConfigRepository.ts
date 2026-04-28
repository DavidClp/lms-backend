export interface PlatformConfigDTO {
  disableStudentPassword: boolean
}

export interface IPlatformConfigRepository {
  get(): Promise<PlatformConfigDTO>
  updateDisableStudentPassword(enabled: boolean): Promise<PlatformConfigDTO>
}
