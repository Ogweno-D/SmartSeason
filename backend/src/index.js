import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import fieldRoutes from './routes/fields.js'
// import swaggerUi from 'swagger-ui-express'
// import { swaggerSpec } from './swagger.js'

import { errorHandler } from './middleware/errorhandler.js'

const app = express()


app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/fields', fieldRoutes)

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use(errorHandler)

const PORT = process.env.PORT || 4000
app.listen(PORT, () =>
  console.log(`API running on http://localhost:${PORT}`)
)
