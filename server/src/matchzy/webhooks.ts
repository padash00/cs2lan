import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { matches, matchEvents } from '../db/schema.js';
import { broadcastMatch } from '../ws/index.js';
import type { MatchZyBaseEvent } from './types.js';

export const matchzyWebhooks: FastifyPluginAsync = async (app) => {
  app.post('/webhooks/matchzy', async (req, reply) => {
    // Auth: MatchZy sends matchzy_remote_log_header_key / _value
    const token = req.headers['x-auth-token'];
    if (token !== config.MATCHZY_WEBHOOK_TOKEN) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    const body = req.body as MatchZyBaseEvent;
    if (!body?.event) {
      return reply.code(400).send({ error: 'missing event' });
    }

    app.log.info({ event: body.event, matchid: body.matchid }, 'matchzy event');

    // Resolve our internal match id from matchzy matchid
    const ourMatch = body.matchid
      ? await db.query.matches.findFirst({
          where: eq(matches.matchzyId, String(body.matchid)),
        })
      : undefined;

    // Persist event
    await db.insert(matchEvents).values({
      matchId: ourMatch?.id,
      serverId: ourMatch?.serverId,
      type: body.event,
      payload: body,
    });

    // Update match state for key events
    if (ourMatch) {
      switch (body.event) {
        case 'series_start':
        case 'going_live': {
          await db
            .update(matches)
            .set({ status: 'live', startedAt: new Date() })
            .where(eq(matches.id, ourMatch.id));
          break;
        }
        case 'round_end': {
          const team1Score = (body as any).team1?.score;
          const team2Score = (body as any).team2?.score;
          if (typeof team1Score === 'number' && typeof team2Score === 'number') {
            await db
              .update(matches)
              .set({ score1: team1Score, score2: team2Score })
              .where(eq(matches.id, ourMatch.id));
          }
          break;
        }
        case 'series_result': {
          await db
            .update(matches)
            .set({ status: 'finished', finishedAt: new Date() })
            .where(eq(matches.id, ourMatch.id));
          break;
        }
      }

      broadcastMatch(ourMatch.id, { type: 'matchzy_event', event: body });
    }

    return reply.send({ ok: true });
  });
};
