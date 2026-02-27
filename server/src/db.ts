import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './db/schema.js';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const hasSslModeRequire = /[?&]sslmode=require(?:&|$)/i.test(dbUrl);

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: hasSslModeRequire ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool, { schema });

export default db;
