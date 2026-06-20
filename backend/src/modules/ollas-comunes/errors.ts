export class OllaServiceError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'OllaServiceError'
  }
}
