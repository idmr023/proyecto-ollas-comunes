export class OrganizationServiceError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'OrganizationServiceError'
    this.statusCode = statusCode
  }
}
