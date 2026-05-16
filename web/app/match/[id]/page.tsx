'use client';

import { use, useEffect, useState } from 'react';
import { api, type Match } from '@/lib/api';
import { useMatchWs } from '@/lib/ws';

export default function MatchLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<(Match & { events: unknown[] }) | null>(null);
  const { events: liveEvents, connected } = useMatchWs(id);

  async function load() {
    try {
      setMatch(await api.matches.get(id));
    } catch {}
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (liveEvents.length > 0) load();
  }, [liveEvents.length]);

  if (!match) return <div>Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold">{match.team1Name}</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black tabular-nums">
              {match.score1} <span className="text-zinc-600">:</span> {match.score2}
            </div>
            <div className="mt-2 text-xs uppercase text-zinc-400">
              BO{match.bestOf} · {match.status}
              {connected && <span className="ml-2 text-green-400">● live</span>}
            </div>
          </div>
          <div className="text-left">
            <div className="text-xl font-bold">{match.team2Name}</div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Events</h2>
        <div className="space-y-1">
          {liveEvents.length === 0 && (
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
              Ожидание событий…
            </div>
          )}
          {liveEvents.map((e, i) => (
            <pre key={i} className="overflow-x-auto rounded bg-black/40 p-2 text-xs text-zinc-300">
              {JSON.stringify(e, null, 2)}
            </pre>
          ))}
        </div>
      </section>
    </div>
  );
}
