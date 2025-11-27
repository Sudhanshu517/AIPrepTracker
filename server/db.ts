import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';
dotenv.config();

// PostgreSQL connection setup - ready for local database
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please add it to your .env file for local PostgreSQL connection.",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Additional configuration for local PostgreSQL
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
});

export const db = drizzle(pool, { schema });

// Test database connection
export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}