import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  MATCHZY_WEBHOOK_TOKEN: z.string().min(8, 'set MATCHZY_WEBHOOK_TOKEN in .env'),
});

export const config = schema.parse(process.env);
export type Config = typeof config;
