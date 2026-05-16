'use client';

import { useEffect, useState } from 'react';
import { api, type Server } from '@/lib/api';

export default function AdminPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      setServers(await api.servers.list());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servers</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {showForm ? 'Cancel' : '+ Add server'}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && <AddServerForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="space-y-2">
        {servers.map((s) => (
          <a
            key={s.id}
            href={`/admin/server/${s.id}`}
            className="block rounded border border-zinc-800 bg-zinc-900/40 p-4 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-zinc-500">
                  {s.host}:{s.port}
                </div>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs uppercase text-zinc-300">
                {s.status}
              </span>
            </div>
          </a>
        ))}
        {servers.length === 0 && (
          <div className="rounded border border-zinc-800 bg-zinc-900/40 p-6 text-center text-zinc-400">
            Серверов пока нет. Добавь первый через «+ Add server».
          </div>
        )}
      </div>
    </div>
  );
}

function AddServerForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('tournament-1');
  const [host, setHost] = useState('192.168.1.50');
  const [port, setPort] = useState(27015);
  const [rconPassword, setRconPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.servers.create({ name, host, port, rconPassword });
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-zinc-400">Name</span>
          <input className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">Host (LAN IP of Windows PC)</span>
          <input className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-sm" value={host} onChange={(e) => setHost(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">Port</span>
          <input type="number" className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-sm" value={port} onChange={(e) => setPort(+e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-400">RCON password</span>
          <input type="password" className="mt-1 w-full rounded bg-zinc-800 px-3 py-2 text-sm" value={rconPassword} onChange={(e) => setRconPassword(e.target.value)} required />
        </label>
      </div>
      {error && <div className="text-sm text-red-300">{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}
