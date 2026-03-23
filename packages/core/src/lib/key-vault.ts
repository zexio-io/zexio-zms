import crypto from 'crypto';
import util from 'util';

const scrypt = util.promisify(crypto.scrypt);

/**
 * KeyVault
 * Secures the Master Key using a user-provided password.
 */
export class KeyVault {
  private static ALGORITHM = 'aes-256-gcm';
  private static SALT_LENGTH = 16;
  private static IV_LENGTH = 12;
  private static KEY_LENGTH = 32;

  /**
   * Encrypts the raw master key with a password.
   */
  static async encrypt(rawKey: string, password: string): Promise<string> {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    // Derive a 256-bit key from the password
    const derivedKey = (await scrypt(password, salt, this.KEY_LENGTH)) as Buffer;
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv) as any;
    
    let encrypted = cipher.update(rawKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = (cipher as any).getAuthTag().toString('hex');
    
    // Format: version:salt:iv:tag:encryptedData
    return `v2:${salt.toString('hex')}:${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  /**
   * Decrypts the master key using the password.
   */
  static async decrypt(vaultData: string, password: string): Promise<string> {
    if (!vaultData.startsWith('v2:')) {
      // Legacy or plain text fallback (should be handled by caller)
      throw new Error("KeyVault: Unsupported or invalid vault format.");
    }

    const parts = vaultData.split(':');
    if (parts.length !== 5) {
      throw new Error("KeyVault: Invalid vault data format.");
    }

    const [, saltHex, ivHex, tagHex, encryptedHex] = parts;
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const derivedKey = (await scrypt(password, salt, this.KEY_LENGTH)) as Buffer;
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv) as any;
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Determines if the data is a KeyVault v2 packet.
   */
  static isEncrypted(data: string): boolean {
    return data.startsWith('v2:');
  }
}
