import type { FastifyPluginAsync } from 'fastify';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { matches, matchEvents, servers } from '../db/schema.js';
import { cmd } from '../rcon/commands.js';

const createMatchSchema = z.object({
  team1Name: z.string().min(1),
  team2Name: z.string().min(1),
  serverId: z.string().uuid().optional(),
  bestOf: z.union([z.literal(1), z.literal(3), z.literal(5)]).default(1),
  mapPool: z.array(z.string()).default(['de_mirage', 'de_inferno', 'de_nuke']),
});

export const matchesApi: FastifyPluginAsync = async (app) => {
  app.get('/api/matches', async () => {
    return db.query.matches.findMany({ orderBy: [desc(matches.createdAt)] });
  });

  app.post('/api/matches', async (req, reply) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const [row] = await db
      .insert(matches)
      .values({ ...parsed.data, matchzyId: crypto.randomUUID() })
      .returning();
    return reply.code(201).send(row);
  });

  app.get<{ Params: { id: string } }>('/api/matches/:id', async (req, reply) => {
    const match = await db.query.matches.findFirst({ where: eq(matches.id, req.params.id) });
    if (!match) return reply.code(404).send({ error: 'not found' });
    const events = await db.query.matchEvents.findMany({
      where: eq(matchEvents.matchId, match.id),
      orderBy: [desc(matchEvents.createdAt)],
      limit: 100,
    });
    return { ...match, events };
  });

  // ── MatchZy fetches this URL via `matchzy_loadmatch_url` ─────────
  app.get<{ Params: { id: string } }>('/api/matches/:id/matchzy.json', async (req, reply) => {
    const match = await db.query.matches.findFirst({ where: eq(matches.id, req.params.id) });
    if (!match) return reply.code(404).send({ error: 'not found' });

    // Minimal MatchZy match config. Extend with players/spectators in P2.
    return {
      matchid: match.matchzyId,
      num_maps: match.bestOf,
      maplist: match.mapPool,
      map_sides: ['team1_ct', 'team2_ct', 'knife'],
      clinch_series: true,
      players_per_team: 5,
      team1: { name: match.team1Name, players: {} },
      team2: { name: match.team2Name, players: {} },
      cvars: {
        hostname: `${match.team1Name} vs ${match.team2Name}`,
        mp_friendlyfire: '1',
      },
    };
  });

  // ── Start match: tell the assigned server to load this match ─────
  app.post<{ Params: { id: string } }>('/api/matches/:id/start', async (req, reply) => {
    const match = await db.query.matches.findFirst({ where: eq(matches.id, req.params.id) });
    if (!match) return reply.code(404).send({ error: 'match not found' });
    if (!match.serverId) return reply.code(400).send({ error: 'no server assigned' });

    const server = await db.query.servers.findFirst({ where: eq(servers.id, match.serverId) });
    if (!server) return reply.code(404).send({ error: 'server not found' });

    // MatchZy will fetch this URL. It must be reachable from the Windows box.
    const host = req.headers['x-forwarded-host'] ?? req.headers.host;
    const proto = req.headers['x-forwarded-proto'] ?? 'http';
    const url = `${proto}://${host}/api/matches/${match.id}/matchzy.json`;

    try {
      const out = await cmd.loadMatchFromUrl(server, url);
      await db.update(matches).set({ status: 'live' }).where(eq(matches.id, match.id));
      return { ok: true, url, output: out };
    } catch (err) {
      return reply.code(502).send({ ok: false, error: (err as Error).message });
    }
  });
};
