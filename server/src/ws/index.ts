import type { FastifyPluginAsync } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import type { WebSocket } from 'ws';

const channels = new Map<string, Set<WebSocket>>();

export function broadcastMatch(matchId: string, payload: unknown) {
  const set = channels.get(matchId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

export const wsPlugin: FastifyPluginAsync = async (app) => {
  await app.register(websocketPlugin);

  app.get<{ Params: { id: string } }>(
    '/ws/match/:id',
    { websocket: true },
    (socket, req) => {
      const matchId = req.params.id;
      let set = channels.get(matchId);
      if (!set) {
        set = new Set();
        channels.set(matchId, set);
      }
      set.add(socket);

      socket.send(JSON.stringify({ type: 'hello', matchId }));

      socket.on('close', () => {
        set?.delete(socket);
        if (set && set.size === 0) channels.delete(matchId);
      });
    },
  );
};
