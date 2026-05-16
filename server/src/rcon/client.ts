import { Rcon } from 'rcon-client';

type Key = string;
const pool = new Map<Key, Rcon>();

function key(host: string, port: number) {
  return `${host}:${port}`;
}

export async function getRcon(host: string, port: number, password: string): Promise<Rcon> {
  const k = key(host, port);
  const existing = pool.get(k);
  if (existing && existing.authenticated) return existing;

  if (existing) {
    try {
      await existing.end();
    } catch {
      // ignore
    }
    pool.delete(k);
  }

  const rcon = new Rcon({ host, port, password, timeout: 5000 });
  rcon.on('end', () => {
    pool.delete(k);
  });
  rcon.on('error', () => {
    pool.delete(k);
  });

  await rcon.connect();
  pool.set(k, rcon);
  return rcon;
}

export async function sendCommand(
  host: string,
  port: number,
  password: string,
  command: string,
): Promise<string> {
  const rcon = await getRcon(host, port, password);
  return rcon.send(command);
}

export async function closeAll(): Promise<void> {
  await Promise.allSettled([...pool.values()].map((r) => r.end()));
  pool.clear();
}
