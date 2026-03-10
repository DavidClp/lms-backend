import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import router from './routes'
import { errorHandler } from './middlewares/error.middleware'

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  }),
)

app.use(express.json())

app.use('/api', router)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}/api`)
})

export default app
