import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uiu_rental_system',
  multipleStatements: true,
});

try {
  const seed = await readFile(path.join(backendRoot, 'database', 'seed.sql'), 'utf8');
  await connection.query(seed);
  console.log('Development seed data applied successfully.');
} finally {
  await connection.end();
}
