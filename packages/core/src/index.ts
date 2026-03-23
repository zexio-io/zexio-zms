import { getMasterKey } from './lib/kms.js';
import { ThresholdProvider } from './lib/threshold-provider.js';

let MASTER_KEY: string | null = null;

/**
 * Bootstraps the ZMS Core.
 * Handles Master Key acquisition from different providers (GSM, AWS, or ENV).
 */
export async function bootstrap() {
  console.log('🏁 ZMS Core: Starting Bootstrap...');
  
  try {
    MASTER_KEY = await getMasterKey();
    console.log(`✅ ZMS Core: Master Key acquired via ${process.env.KMS_PROVIDER || 'env'}`);
  } catch (error: any) {
    console.warn(`⚠️ ZMS Core: Master Key acquisition failed: ${error.message}`);
    // Fallback logic if needed, but usually this is a fatal error for a vault
    throw error;
  }

  console.log('✅ ZMS Core: Bootstrap Completed.');
}

/**
 * Returns the decrypted Global Master Key.
 * Fails if bootstrap() wasn't called.
 */
export function getGlobalMasterKey(): string {
  if (!MASTER_KEY) {
    if (process.env.MASTER_KEY) return process.env.MASTER_KEY; // Fallback for simple dev
    throw new Error("ZMS Error: Core not bootstrapped or MASTER_KEY missing.");
  }
  return MASTER_KEY;
}

/**
 * Generates recovery shards for the current Global Master Key.
 * @param n Total shards to generate
 * @param t Threshold required for reconstruction
 */
export function generateRecoveryShards(n: number = 5, t: number = 3): string[] {
  const key = getGlobalMasterKey();
  return ThresholdProvider.split(key, n, t);
}

/**
 * Reconstructs the Global Master Key from provided shards.
 * WARNING: This is a sensitive operation used in emergency recovery.
 */
export function recoverMasterKey(shards: string[]): string {
  return ThresholdProvider.reconstruct(shards);
}

export * from './crypto.js';
export * from './repository.js';
export * from './lib/kms.js';
export * from './lib/kms-provider.js';
export * from './lib/google-kms-provider.js';
export * from './lib/threshold-provider.js';
export * from './recovery.js';
export * from "./schema.js";
import * as schema from "./schema.js";
export { schema };
export { db, currentDbPath } from './db.js';

// Orchestration
export * from './orchestration/domain/entities.js';
export * from './orchestration/domain/repository.js';
export * from './orchestration/infrastructure/db-repository.js';
export * from './orchestration/application/service.js';

export const version = '1.1.0-hardening';

export function init() {
  console.log('ZMS Initialized (v' + version + ')');
  return true;
}
