import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseName = process.env.DB_NAME || 'uiu_rental_system';
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

interface MigrationRow extends RowDataPacket {
  name: string;
}

function quoteIdentifier(identifier: string): string {
  return `\`${identifier.replaceAll('`', '``')}\``;
}

function prepareBaselineSql(sql: string): string {
  // The connection is already scoped to DB_NAME. Remove the baseline file's
  // hard-coded database selection so custom local database names work.
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`[\s\S]*?;\s*/i, '')
    .replace(/USE `[^`]+`;\s*/i, '');
}

async function main(): Promise<void> {
  const admin = await mysql.createConnection(mysqlConfig);
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await admin.end();

  const connection = await mysql.createConnection({
    ...mysqlConfig,
    database: databaseName,
    multipleStatements: true,
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [appliedRows] = await connection.query<MigrationRow[]>(
      'SELECT name FROM _schema_migrations',
    );
    const applied = new Set(appliedRows.map((row) => row.name));

    if (!applied.has('000_baseline_schema')) {
      const [tableRows] = await connection.query<RowDataPacket[]>(
        "SHOW TABLES LIKE 'users'",
      );
      if (tableRows.length === 0) {
        const baseline = await readFile(
          path.join(backendRoot, 'database', 'schema.sql'),
          'utf8',
        );
        await connection.query(prepareBaselineSql(baseline));
      }
      await connection.query(
        "INSERT INTO _schema_migrations (name) VALUES ('000_baseline_schema')",
      );
    }

    const migrationDirectory = path.join(backendRoot, 'database', 'migrations');
    const migrationNames = (await import('node:fs/promises')).readdir(
      migrationDirectory,
    );

    for (const migrationName of (await migrationNames).filter((name) => name.endsWith('.sql')).sort()) {
      if (applied.has(migrationName)) {
        continue;
      }

      const migration = await readFile(path.join(migrationDirectory, migrationName), 'utf8');
      await connection.beginTransaction();
      try {
        await connection.query(migration);
        await connection.query('INSERT INTO _schema_migrations (name) VALUES (?)', [migrationName]);
        await connection.commit();
        console.log(`Applied migration: ${migrationName}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.end();
  }

  console.log(`Database migrations complete: ${databaseName}`);
}

main().catch((error: unknown) => {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
});
