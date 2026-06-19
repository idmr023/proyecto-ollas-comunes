import { Router } from 'express'

const mobileRouter = Router()

mobileRouter.get('/health', (_request, response) => {
  response.json({ ok: true, module: 'mobile' })
})

export { mobileRouter }
