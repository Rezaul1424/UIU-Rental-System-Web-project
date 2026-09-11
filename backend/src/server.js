import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testDbConnection } from './config/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'UIU Rental System Backend API is running',
    timestamp: new Date().toISOString(),
  })
})

// Start server and verify DB connection
app.listen(PORT, async () => {
  console.log(` Server is running on port ${PORT}`)
  await testDbConnection()
})

export default app
