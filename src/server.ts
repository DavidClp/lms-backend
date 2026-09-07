import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import router from './routes'
import { errorHandler } from './middlewares/error.middleware'

const app = express()

app.use(cors())

app.use(express.json())

app.use('/', router)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`)
})

export default app
