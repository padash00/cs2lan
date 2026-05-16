const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type Server = {
  id: string;
  name: string;
  host: string;
  port: number;
  rconPassword: string;
  status: 'online' | 'offline' | 'in_use';
  createdAt: string;
};

export type Match = {
  id: string;
  team1Name: string;
  team2Name: string;
  serverId: string | null;
  bestOf: number;
  status: 'pending' | 'live' | 'finished';
  score1: number;
  score2: number;
  matchzyId: string | null;
  mapPool: string[];
  createdAt: string;
};

export const api = {
  servers: {
    list: () => request<Server[]>('/api/servers'),
    get: (id: string) => request<Server>(`/api/servers/${id}`),
    create: (data: Omit<Server, 'id' | 'status' | 'createdAt'>) =>
      request<Server>('/api/servers', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) =>
      fetch(`${API}/api/servers/${id}`, { method: 'DELETE' }).then((r) => r.ok),
    status: (id: string) =>
      request<{ online: boolean; raw?: string; error?: string }>(`/api/servers/${id}/status`),
    cmd: (id: string, name: string, body?: unknown) =>
      request<{ ok: boolean; output?: string; error?: string }>(
        `/api/servers/${id}/cmd/${name}`,
        { method: 'POST', body: body ? JSON.stringify(body) : '{}' },
      ),
  },
  matches: {
    list: () => request<Match[]>('/api/matches'),
    get: (id: string) => request<Match & { events: unknown[] }>(`/api/matches/${id}`),
    create: (data: { team1Name: string; team2Name: string; bestOf: 1 | 3 | 5; mapPool?: string[]; serverId?: string }) =>
      request<Match>('/api/matches', { method: 'POST', body: JSON.stringify(data) }),
    start: (id: string) => request<{ ok: boolean; url: string }>(`/api/matches/${id}/start`, { method: 'POST' }),
  },
};

export const wsUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001'}${path}`;
