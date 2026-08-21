import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// neon() returns a tagged-template sql function.
// Each call gets a fresh HTTP connection — perfect for Vercel serverless.
const sql = neon(process.env.DATABASE_URL);

export default sql;
