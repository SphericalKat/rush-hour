// Base URL is set via EXPO_PUBLIC_API_URL at build time.
// During local dev, point to your machine's LAN IP:
// EXPO_PUBLIC_API_URL=http://192.168.x.x:8080
const BASE_URL =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:8080';

export const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws';

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export { BASE_URL };
