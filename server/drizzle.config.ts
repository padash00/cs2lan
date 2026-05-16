import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';

// load root .env (monorepo single source of truth)
loadEnv({ path: resolve(__dirname, '../.env') });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://cs2:cs2@localhost:5432/cs2_tournament',
  },
});
