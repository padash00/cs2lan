'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type Props = { serverId: string };

const btn =
  'rounded bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50 transition-colors';
const danger = 'rounded bg-red-900/60 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-800';
const primary = 'rounded bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark';

export function MatchControls({ serverId }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string>('');

  async function run(name: string, body?: unknown) {
    setBusy(name);
    setLastResult('');
    try {
      const res = await api.servers.cmd(serverId, name, body);
      setLastResult(`✓ ${name}: ${res.output ?? 'ok'}`);
    } catch (err) {
      setLastResult(`✗ ${name}: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <button className={primary} disabled={!!busy} onClick={() => run('knife-round')}>
          🔪 Knife round
        </button>
        <button className={btn} disabled={!!busy} onClick={() => run('restart-round')}>
          ↻ Restart round
        </button>
        <button className={danger} disabled={!!busy} onClick={() => run('restart-map')}>
          ↻↻ Restart map
        </button>
        <button className={btn} disabled={!!busy} onClick={() => run('pause')}>
          ⏸ Pause
        </button>
        <button className={btn} disabled={!!busy} onClick={() => run('unpause')}>
          ▶ Unpause
        </button>
        <button className={btn} disabled={!!busy} onClick={() => run('swap-teams')}>
          ⇄ Swap teams
        </button>
        <button className={btn} disabled={!!busy} onClick={() => run('start-warmup')}>
          🟢 Start warmup
        </button>
        <button className={btn} disabled={!!busy} onClick={() => run('end-warmup')}>
          🔴 End warmup
        </button>
      </div>

      <ChangeMap serverId={serverId} disabled={!!busy} onResult={setLastResult} />
      <RawCommand serverId={serverId} disabled={!!busy} onResult={setLastResult} />

      {lastResult && (
        <pre className="overflow-x-auto rounded bg-black/40 p-3 text-xs text-zinc-300">
          {lastResult}
        </pre>
      )}
    </div>
  );
}

function ChangeMap({
  serverId,
  disabled,
  onResult,
}: {
  serverId: string;
  disabled: boolean;
  onResult: (s: string) => void;
}) {
  const [map, setMap] = useState('de_mirage');
  return (
    <div className="flex gap-2">
      <select
        value={map}
        onChange={(e) => setMap(e.target.value)}
        className="rounded bg-zinc-800 px-3 py-2 text-sm"
      >
        {['de_mirage', 'de_inferno', 'de_nuke', 'de_anubis', 'de_ancient', 'de_overpass', 'de_vertigo'].map(
          (m) => (
            <option key={m} value={m}>{m}</option>
          ),
        )}
      </select>
      <button
        className={btn}
        disabled={disabled}
        onClick={async () => {
          try {
            const res = await api.servers.cmd(serverId, 'change-map', { map });
            onResult(`✓ change-map ${map}: ${res.output ?? 'ok'}`);
          } catch (err) {
            onResult(`✗ change-map: ${(err as Error).message}`);
          }
        }}
      >
        Change map
      </button>
    </div>
  );
}

function RawCommand({
  serverId,
  disabled,
  onResult,
}: {
  serverId: string;
  disabled: boolean;
  onResult: (s: string) => void;
}) {
  const [cmd, setCmd] = useState('status');
  return (
    <div className="flex gap-2">
      <input
        value={cmd}
        onChange={(e) => setCmd(e.target.value)}
        placeholder="raw rcon command (e.g. status)"
        className="flex-1 rounded bg-zinc-800 px-3 py-2 font-mono text-sm"
      />
      <button
        className={btn}
        disabled={disabled || !cmd}
        onClick={async () => {
          try {
            const res = await api.servers.cmd(serverId, 'raw', { command: cmd });
            onResult(`✓ ${cmd}:\n${res.output ?? 'ok'}`);
          } catch (err) {
            onResult(`✗ ${cmd}: ${(err as Error).message}`);
          }
        }}
      >
        Send
      </button>
    </div>
  );
}
