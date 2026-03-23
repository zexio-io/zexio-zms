import { KmsProvider, EnvKmsProvider, LocalFileKmsProvider } from "./kms-provider.js";
import { GoogleKmsProvider } from "./google-kms-provider.js";

/**
 * KMS Factory
 * Choose the provider based on environment variables.
 */
function getKmsProvider(): KmsProvider {
  const providerType = process.env.KMS_PROVIDER;
  
  if (providerType === 'google') {
    const secretName = process.env.GOOGLE_KMS_SECRET_NAME;
    if (!secretName) {
      throw new Error("GOOGLE_KMS_SECRET_NAME must be set when KMS_PROVIDER is 'google'");
    }
    return new GoogleKmsProvider(secretName);
  }

  if (providerType === 'env') {
    return new EnvKmsProvider();
  }

  // Default for Community Edition / CLI: Local File
  return new LocalFileKmsProvider();
}

/**
 * Retrieves the Global Master Key from the active provider.
 */
export async function getMasterKey(): Promise<string> {
  const provider = getKmsProvider();
  return await provider.getMasterKey();
}

/**
 * Decrypts a key (Deprecated/Backward compatibility for AWS if still needed)
 * @deprecated Use getMasterKey() for pure managed bootstrap.
 */
export async function decryptMasterKey(encryptedKey: string): Promise<string> {
    console.warn("decryptMasterKey is deprecated. Moving towards pure provider-based bootstrap.");
    // For now, if someone passes an encrypted key, we might still want AWS logic, 
    // but the goal is to shift to GSM/SecretManager where the "encryption" is managed by the cloud.
    return encryptedKey; 
}
