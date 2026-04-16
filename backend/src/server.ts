import 'dotenv/config'

import { app } from './app'

const port = Number(process.env.PORT ?? 4000)

app.listen(port, () => {
  console.log(`SIGO-OLLAS backend listening on http://localhost:${port}`)
})