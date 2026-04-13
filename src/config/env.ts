import { z } from 'zod';
import dotenv from 'dotenv';
import {logger} from '../utils/log.js';
import { error } from 'node:console';

dotenv.config();

const envSchema = z.object({

  SERVICE_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  

  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.url(),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  REDIS_URL : z.url(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {

  const errors = z.treeifyError(_env.error)
  
  console.error("Environment Validation Failed", {error});

  process.exit(1);
}

export const env = _env.data;