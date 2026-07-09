export class OllaServiceError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'OllaServiceError'
    this.statusCode = statusCode
  }
}
