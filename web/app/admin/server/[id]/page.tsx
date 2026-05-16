'use client';

import { use, useEffect, useState } from 'react';
import { api, type Server } from '@/lib/api';
import { MatchControls } from '@/components/match-controls';

export default function ServerControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<Server | null>(null);
  const [status, setStatus] = useState<{ online: boolean; raw?: string; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadServer() {
    try {
      setServer(await api.servers.get(id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function loadStatus() {
    try {
      setStatus(await api.servers.status(id));
    } catch (err) {
      setStatus({ online: false, error: (err as Error).message });
    }
  }

  useEffect(() => {
    loadServer();
    loadStatus();
    const t = setInterval(loadStatus, 10000);
    return () => clearInterval(t);
  }, [id]);

  if (error) return <div className="text-red-300">Error: {error}</div>;
  if (!server) return <div>Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <a href="/admin" className="text-sm text-zinc-400 hover:text-zinc-100">← Servers</a>
        <h1 className="mt-2 text-2xl font-bold">{server.name}</h1>
        <div className="text-sm text-zinc-500">
          {server.host}:{server.port} ·{' '}
          <span className={status?.online ? 'text-green-400' : 'text-red-400'}>
            {status?.online ? '● online' : '● offline'}
          </span>
        </div>
      </div>

      <section className="rounded border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="mb-4 text-lg font-semibold">Match control</h2>
        <MatchControls serverId={server.id} />
      </section>

      <section className="rounded border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Server status</h2>
          <button onClick={loadStatus} className="text-sm text-zinc-400 hover:text-zinc-100">
            ↻ Refresh
          </button>
        </div>
        {status?.online ? (
          <pre className="overflow-x-auto rounded bg-black/40 p-3 text-xs text-zinc-300">
            {status.raw}
          </pre>
        ) : (
          <div className="text-sm text-zinc-400">
            {status?.error ?? 'Сервер offline или RCON недоступен'}
          </div>
        )}
      </section>
    </div>
  );
}
