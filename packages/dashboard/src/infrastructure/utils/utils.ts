import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined') {
    // 1. If we are in Fused CLI Mode (Served by the same 3030/custom port), use relative
    if (window.location.host && !window.location.host.includes('localhost:3000')) {
      return '/v1';
    }

    // 2. If we're on port 3000 (Next.js Dev), point to local API (3030 default)
    if (window.location.port === '3000') {
        const baseUrl = envUrl || 'http://localhost:3030';
        return `${baseUrl.replace(/\/$/, '')}/v1`;
    }
  }

  if (envUrl) return `${envUrl.replace(/\/$/, '')}/v1`;
  return '/v1';
}

export function resolveOrgId(urlId?: string | string[], activeId?: string): string {
  // 1. Prioritize Search Param ?oid=
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const oid = params.get('oid');
    if (oid) return oid;
  }

  // 2. Fallback to Dynamic Param if it's not "primary"
  const idValue = Array.isArray(urlId) ? urlId[0] : urlId;
  if (idValue && idValue !== "primary") return idValue;

  // 3. Last fallback to store
  return activeId || "";
}

export function resolveProjectId(urlId?: string | string[], activeId?: string): string {
  // 1. Prioritize Search Param ?pid=
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('pid');
    if (pid) return pid;
  }

  // 2. Fallback to Dynamic Param if it's not "default"
  const idValue = Array.isArray(urlId) ? urlId[0] : urlId;
  if (idValue && idValue !== "default") return idValue;

  // 3. Last fallback to store
  return activeId || "";
}
