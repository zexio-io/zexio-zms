import { getApiBaseUrl } from "../utils/utils";

const API_URL = getApiBaseUrl();

export const authClient = {
  async login({ email, password }: any) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("better-auth.session_token", data.token);
      return { data, error: null };
    }
    return { data: null, error: { message: data.error || "Login failed" } };
  },

  async setup({ name, email, password }: any) {
    const res = await fetch(`${API_URL}/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("better-auth.session_token", data.token);
      return { data, error: null };
    }
    return { data: null, error: { message: data.error || "Setup failed" } };
  },

  async getSession() {
    const token = localStorage.getItem("better-auth.session_token");
    if (!token) return { data: null };

    const res = await fetch(`${API_URL}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.user) {
      return { data: { user: data.user }, error: null };
    }
    return { data: null, error: { message: "Failed to get session" } };
  },

  async signOut() {
    localStorage.removeItem("better-auth.session_token");
    window.location.href = "/login";
  },
};

// Compatibility exports for existing code
export const signIn = {
    email: authClient.login
};
export const signUp = {
    email: authClient.setup
};
export const signOut = authClient.signOut;

export const useSession = () => {
    // Basic polling or hook-based session checking can be added here
    // For now, keeping it minimal to match existing components
    return { data: null, loading: false }; 
};
