import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { wsPlugin } from './ws/index.js';
import { serversApi } from './api/servers.js';
import { matchesApi } from './api/matches.js';
import { matchzyWebhooks } from './matchzy/webhooks.js';
import { closeAll } from './rcon/client.js';

const app = Fastify({
  logger: {
    transport:
      config.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } }
        : undefined,
  },
});

await app.register(cors, { origin: true });

await app.register(wsPlugin);
await app.register(matchzyWebhooks);
await app.register(serversApi);
await app.register(matchesApi);

app.get('/health', async () => ({ ok: true }));

const shutdown = async () => {
  app.log.info('shutting down');
  await closeAll();
  await app.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  app.log.info(`API listening on http://localhost:${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
