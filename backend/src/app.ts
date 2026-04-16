import cors from 'cors'
import express from 'express'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (_request, response) => {
  response.json({
    name: 'SIGO-OLLAS API',
    status: 'ready',
  })
})

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'backend',
    timestamp: new Date().toISOString(),
  })
})

export { app }