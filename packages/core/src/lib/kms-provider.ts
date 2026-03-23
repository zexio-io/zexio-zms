/**
 * KmsProvider Abstraction
 * Allows ZMS to fetch its Master Key from different sources (GSM, AWS, ENV).
 */
export interface KmsProvider {
  /**
   * Fetches the Master Key from the provider's source.
   */
  getMasterKey(): Promise<string>;
}

import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import { KeyVault } from './key-vault.js';
import { getMachineId } from './machine.js';

/**
 * Env-based KMS Provider
 * Used for local development and self-hosted non-KMS setups.
 */
export class EnvKmsProvider implements KmsProvider {
  async getMasterKey(): Promise<string> {
    const key = process.env.MASTER_KEY;
    if (!key) {
      throw new Error("EnvKmsProvider: MASTER_KEY environment variable is not set.");
    }
    return key;
  }
}

/**
 * Local File KMS Provider (Community Edition)
 * Automatically generates and persists a Master Key to ~/.zms/master.key
 * if no environmental key is found.
 */
export class LocalFileKmsProvider implements KmsProvider {
  async getMasterKey(): Promise<string> {
    const homeDir = os.homedir();
    const zexioDir = path.join(homeDir, '.zexio');
    const keyPath = path.join(zexioDir, 'zms.master.key');

    // Ensure directory exists
    if (!fs.existsSync(zexioDir)) {
      fs.mkdirSync(zexioDir, { recursive: true });
    }

    // Check if key already exists
    if (fs.existsSync(keyPath)) {
      const storedData = fs.readFileSync(keyPath, 'utf8').trim();
      
      if (KeyVault.isEncrypted(storedData)) {
        const password = process.env.ZMS_KEY_PASSWORD || getMachineId();
        return await KeyVault.decrypt(storedData, password);
      }
      
      return storedData;
    }

    // Generate new secure key (32 bytes / 256-bit)
    const newKey = crypto.randomBytes(32).toString('hex');
    
    // Always encrypt with ZMS_KEY_PASSWORD or machineId for device-binding
    const password = process.env.ZMS_KEY_PASSWORD || getMachineId();
    const encrypted = await KeyVault.encrypt(newKey, password);
    fs.writeFileSync(keyPath, encrypted, { mode: 0o600 });
    
    if (process.env.ZMS_KEY_PASSWORD) {
      console.log(`🛡️ ZMS Core: New Master Key generated and ENCRYPTED (Custom Password) to ${keyPath}`);
    } else {
      console.log(`🛡️ ZMS Core: New Master Key generated and DEVICE-BOUND (Machine ID) to ${keyPath}`);
    }
    
    return newKey;
  }
}
