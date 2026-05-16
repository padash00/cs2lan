import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { servers } from '../db/schema.js';
import { cmd } from '../rcon/commands.js';

const createSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive().default(27015),
  rconPassword: z.string().min(1),
  gsltToken: z.string().optional(),
});

const rawCmdSchema = z.object({
  command: z.string().min(1),
});

const changeMapSchema = z.object({
  map: z.string().regex(/^[a-z0-9_]+$/, 'invalid map name'),
});

async function getServerOr404(reply: any, id: string) {
  const s = await db.query.servers.findFirst({ where: eq(servers.id, id) });
  if (!s) {
    reply.code(404).send({ error: 'server not found' });
    return null;
  }
  return s;
}

export const serversApi: FastifyPluginAsync = async (app) => {
  app.get('/api/servers', async () => {
    return db.query.servers.findMany();
  });

  app.post('/api/servers', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const [row] = await db.insert(servers).values(parsed.data).returning();
    return reply.code(201).send(row);
  });

  app.get<{ Params: { id: string } }>('/api/servers/:id', async (req, reply) => {
    const s = await getServerOr404(reply, req.params.id);
    return s;
  });

  app.delete<{ Params: { id: string } }>('/api/servers/:id', async (req, reply) => {
    await db.delete(servers).where(eq(servers.id, req.params.id));
    return reply.code(204).send();
  });

  // ── Live status via RCON ───────────────────────────────────────
  app.get<{ Params: { id: string } }>('/api/servers/:id/status', async (req, reply) => {
    const s = await getServerOr404(reply, req.params.id);
    if (!s) return;
    try {
      const status = await cmd.status(s);
      return { online: true, raw: status };
    } catch (err) {
      app.log.warn({ err }, 'rcon status failed');
      return { online: false, error: (err as Error).message };
    }
  });

  // ── Commands ────────────────────────────────────────────────────
  const wrap =
    (fn: (s: Awaited<ReturnType<typeof getServerOr404>>) => Promise<string>) =>
    async (req: any, reply: any) => {
      const s = await getServerOr404(reply, req.params.id);
      if (!s) return;
      try {
        const out = await fn(s);
        return { ok: true, output: out };
      } catch (err) {
        return reply.code(502).send({ ok: false, error: (err as Error).message });
      }
    };

  app.post<{ Params: { id: string } }>(
    '/api/servers/:id/cmd/restart-round',
    wrap((s) => cmd.restartRound(s!)),
  );
  app.post<{ Params: { id: string } }>(
    '/api/servers/:id/cmd/restart-map',
    wrap((s) => cmd.restartMap(s!)),
  );
  app.post<{ Params: { id: string } }>(
    '/api/servers/:id/cmd/swap-teams',
    wrap((s) => cmd.swapTeams(s!)),
  );
  app.post<{ Params: { id: string } }>('/api/servers/:id/cmd/pause', wrap((s) => cmd.pause(s!)));
  app.post<{ Params: { id: string } }>(
    '/api/servers/:id/cmd/unpause',
    wrap((s) => cmd.unpause(s!)),
  );
  app.post<{ Params: { id: string } }>(
    '/api/servers/:id/cmd/knife-round',
    wrap((s) => cmd.knifeRound(s!)),
  );
  app.post<{ Params: { id: string } }>(
    '/api/servers/:id/cmd/start-warmup',
    wrap((s) => cmd.startWarmup(s!)),
  );
  app.post<{ Params: { id: string } }>(
    '/api/servers/:id/cmd/end-warmup',
    wrap((s) => cmd.endWarmup(s!)),
  );

  app.post<{ Params: { id: string } }>('/api/servers/:id/cmd/change-map', async (req, reply) => {
    const parsed = changeMapSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const s = await getServerOr404(reply, req.params.id);
    if (!s) return;
    try {
      const out = await cmd.changeMap(s, parsed.data.map);
      return { ok: true, output: out };
    } catch (err) {
      return reply.code(502).send({ ok: false, error: (err as Error).message });
    }
  });

  app.post<{ Params: { id: string } }>('/api/servers/:id/cmd/raw', async (req, reply) => {
    const parsed = rawCmdSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const s = await getServerOr404(reply, req.params.id);
    if (!s) return;
    try {
      const out = await cmd.raw(s, parsed.data.command);
      return { ok: true, output: out };
    } catch (err) {
      return reply.code(502).send({ ok: false, error: (err as Error).message });
    }
  });
};
