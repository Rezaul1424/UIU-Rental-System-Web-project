import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// Create a connection pool for MySQL
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // Returns MySQL DECIMAL fields as numbers instead of strings
})

// Helper to test DB connection on server startup
export async function testDbConnection() {
  try {
    const connection = await pool.getConnection()
    console.log(' Successfully connected to MySQL database:', process.env.DB_NAME || 'uiu_rental_system')
    connection.release()
  } catch (error) {
    console.error(' MySQL Database connection failed:', error.message)
    console.error('  Please ensure MySQL server is running and credentials in .env are correct.')
  }
}

export default pool

