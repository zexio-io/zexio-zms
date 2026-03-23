import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { KmsProvider } from "./kms-provider.js";

/**
 * Google Secret Manager (GSM) KMS Provider
 * Fetches the Master Key from Google's managed secret storage.
 * Requires GOOGLE_APPLICATION_CREDENTIALS to be set.
 */
export class GoogleKmsProvider implements KmsProvider {
  private client = new SecretManagerServiceClient();

  constructor(private secretName: string) {}

  async getMasterKey(): Promise<string> {
    if (!this.secretName) {
      throw new Error("GoogleKmsProvider: secretName is not specified.");
    }

    try {
      // Access the latest version of the secret
      const [version] = await this.client.accessSecretVersion({
        name: `${this.secretName}/versions/latest`,
      });

      const payload = version.payload?.data?.toString();
      if (!payload) {
        throw new Error(`GoogleKmsProvider: Secret payload is empty for ${this.secretName}`);
      }

      return payload;
    } catch (error: any) {
      console.error("GoogleKmsProvider Error:", error);
      throw new Error(`Failed to fetch secret from Google: ${error.message}`);
    }
  }
}
