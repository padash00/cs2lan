import { api } from '@/lib/api';

export default async function Home() {
  let matches: Awaited<ReturnType<typeof api.matches.list>> = [];
  let error: string | null = null;
  try {
    matches = await api.matches.list();
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Matches</h1>

      {error && (
        <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          Backend недоступен: {error}
          <br />
          Запусти бэкенд: <code className="text-red-100">pnpm --filter server dev</code>
        </div>
      )}

      {matches.length === 0 && !error && (
        <div className="rounded border border-zinc-800 bg-zinc-900/40 p-6 text-center text-zinc-400">
          Пока нет матчей.{' '}
          <a href="/admin" className="text-brand hover:underline">
            Создать в админке →
          </a>
        </div>
      )}

      <div className="space-y-2">
        {matches.map((m) => (
          <a
            key={m.id}
            href={`/match/${m.id}`}
            className="block rounded border border-zinc-800 bg-zinc-900/40 p-4 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {m.team1Name} <span className="text-zinc-500">vs</span> {m.team2Name}
              </div>
              <div className="text-sm">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  BO{m.bestOf}
                </span>{' '}
                <StatusBadge status={m.status} />
              </div>
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              Score: {m.score1} – {m.score2}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-zinc-700 text-zinc-200',
    live: 'bg-green-700 text-green-100',
    finished: 'bg-blue-900 text-blue-100',
  };
  return (
    <span className={`ml-2 rounded px-2 py-0.5 text-xs uppercase ${colors[status] ?? colors.pending}`}>
      {status}
    </span>
  );
}
