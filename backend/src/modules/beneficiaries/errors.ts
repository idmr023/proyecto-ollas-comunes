export class BeneficiaryServiceError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'BeneficiaryServiceError'
    this.statusCode = statusCode
  }
}
