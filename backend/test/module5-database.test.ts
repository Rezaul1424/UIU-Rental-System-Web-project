import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const databaseRoot = path.resolve(process.cwd(), 'database');
const schema = readFileSync(path.join(databaseRoot, 'schema.sql'), 'utf8');
const migration = readFileSync(
  path.join(databaseRoot, 'migrations', '001_shared_entities.sql'),
  'utf8',
);
const authMigration = readFileSync(
  path.join(databaseRoot, 'migrations', '002_auth_workflow_entities.sql'),
  'utf8',
);
const seed = readFileSync(path.join(databaseRoot, 'seed.sql'), 'utf8');

const requiredBaseTables = [
  'users',
  'properties',
  'property_images',
  'amenities',
  'property_amenities',
  'applications',
  'rent_payments',
  'maintenance_requests',
  'reviews',
  'favorites',
  'conversations',
  'chat_messages',
  'complaints',
  'complaint_replies',
  'notifications',
];

const requiredSharedTables = [
  'listing_categories',
  'addresses',
  'property_rooms',
  'leases',
  'audit_events',
];

describe('Module 5 database artifacts', () => {
  it('defines the required base tables and referential constraints', () => {
    for (const table of requiredBaseTables) {
      expect(schema).toContain(`CREATE TABLE \`${table}\``);
    }

    expect(schema).toContain('FOREIGN KEY (`property_id`) REFERENCES `properties`');
    expect(schema).toContain('PRIMARY KEY (`student_id`, `property_id`)');
    expect(schema).toContain('DECIMAL(10, 2)');
  });

  it('adds normalized shared entities with indexes and audit retention', () => {
    for (const table of requiredSharedTables) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS \`${table}\``);
    }

    expect(migration).toContain('INDEX `idx_addresses_coordinates`');
    expect(migration).toContain('INDEX `idx_leases_property_status`');
    expect(migration).toContain('INDEX `idx_audit_resource`');
    expect(migration).toContain('ON DELETE SET NULL');
  });

  it('provides repeatable development fixtures for required lifecycle states', () => {
    expect(seed).toContain("'pending-landlord@example.test'");
    expect(seed).toContain("'suspended-landlord@example.test'");
    expect(seed).toContain("'suspended-student@example.test'");
    expect(seed).toContain("'occupied'");
    expect(seed).toContain("'under-review'");
    expect(seed).toContain("'resolved'");
    expect(seed).toContain("'paid'");
    expect(seed).toContain('ON DUPLICATE KEY UPDATE');
    expect(seed).toContain('WHERE NOT EXISTS');
  });

  it('defines persistent authentication, maintenance, rent, and receipt entities', () => {
    for (const table of ['auth_sessions', 'password_reset_tokens', 'maintenance_comments', 'maintenance_attachments', 'rent_obligations', 'payment_receipts']) {
      expect(authMigration).toContain(`CREATE TABLE IF NOT EXISTS \`${table}\``);
    }

    expect(authMigration).toContain('`token_hash` CHAR(64) NOT NULL UNIQUE');
    expect(authMigration).toContain('UNIQUE KEY `uk_rent_obligation_month`');
    expect(authMigration).toContain('`receipt_number` VARCHAR(50) NOT NULL UNIQUE');
  });
});
