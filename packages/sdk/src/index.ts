export interface ZmsConfig {
  baseUrl: string;
  apiKey: string;
}

export class ZmsClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ZmsConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  /**
   * Fetches a single secret by path.
   * Uses context-aware routing on the server.
   */
  async getSecret(path: string): Promise<string | null> {
    const encodedPath = encodeURIComponent(path);
    const url = `${this.baseUrl}/v1/secrets/current/${encodedPath}`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-ZMS-Token': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`ZMS SDK Error: ${response.status} ${response.statusText}`);
      }

      const body = await response.json() as any;
      return body.data?.content || null;
    } catch (error) {
      console.error('ZMS SDK Fetch Error:', error);
      throw error;
    }
  }

  /**
   * Fetches all secrets for the context associated with the API key.
   */
  async getAllSecrets(): Promise<Record<string, string>> {
    const url = `${this.baseUrl}/v1/secrets/current`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-ZMS-Token': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ZMS SDK Error: ${response.status} ${response.statusText}`);
      }

      const body = await response.json() as any;
      return body.data || {};
    } catch (error) {
      console.error('ZMS SDK Fetch Error:', error);
      throw error;
    }
  }
}

/**
 * Convenience function to inject all secrets into process.env
 */
export async function inject(config: ZmsConfig): Promise<void> {
  const client = new ZmsClient(config);
  const secrets = await client.getAllSecrets();
  
  for (const [key, value] of Object.entries(secrets)) {
    // Only inject if not already present, or overwrite? 
    // Usually injection means providing defaults or overwriting local env.
    process.env[key] = value;
  }
}
