import { getApiBaseUrl } from "../utils/utils";

export class ZmsApiClient {
  private static orgId: string | null = null;
  private static envId: string | null = null;
  private static serviceId: string | null = null;

  static setContext(orgId: string | null, envId: string | null = null, serviceId: string | null = null) {
    this.orgId = orgId;
    this.envId = envId;
    this.serviceId = serviceId;
  }

  private static async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${getApiBaseUrl()}${path}`;
    
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.orgId) headers.set('X-ZMS-Organization-Id', this.orgId);
    if (this.envId) headers.set('X-ZMS-Environment-Id', this.envId);
    if (this.serviceId) headers.set('X-ZMS-Service-Id', this.serviceId);

    // Support for Better Auth token in header (if cookies fail)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('better-auth.session_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });

    console.log(`🌐 API Request: ${options.method || 'GET'} ${path} | Auth: ${headers.get('Authorization') ? 'Yes' : 'No'}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown Error' }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  static get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  static post<T>(path: string, body: any, options?: RequestInit) {
    return this.request<T>(path, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
  }

  static patch<T>(path: string, body: any, options?: RequestInit) {
    return this.request<T>(path, { 
      ...options, 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    });
  }

  static delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}
