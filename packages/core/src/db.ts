import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';

import path from 'path';
import os from 'os';
import fs from 'fs';

const getDbPath = () => {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) return envUrl;

  // Default for Community Edition: ~/.zexio/zms.db
  const homeDir = os.homedir();
  const zexioDir = path.join(homeDir, '.zexio');
  
  // Ensure the directory exists
  if (!fs.existsSync(zexioDir)) {
    fs.mkdirSync(zexioDir, { recursive: true });
  }
  
  return `file:${path.join(zexioDir, 'zms.db')}`;
};

const connectionString = getDbPath();
const client = createClient({ url: connectionString });
export const db = drizzle(client, { schema });
export const currentDbPath = connectionString.replace('file:', '');
