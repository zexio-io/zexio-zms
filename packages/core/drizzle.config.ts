import { defineConfig } from 'drizzle-kit';
import path from 'path';
import os from 'os';

const dbDir = path.resolve(os.homedir(), '.zexio');
const currentDbPath = process.env.DATABASE_URL || `file:${path.join(dbDir, 'zms.db')}`;

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: currentDbPath,
  },
});
