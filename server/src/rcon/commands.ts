import type { Server } from '../db/schema.js';
import { sendCommand } from './client.js';

const run = (s: Server, cmd: string) => sendCommand(s.host, s.port, s.rconPassword, cmd);

export const cmd = {
  status: (s: Server) => run(s, 'status'),

  restartRound: (s: Server) => run(s, 'mp_restartgame 1'),

  restartMap: (s: Server) => run(s, 'matchzy_restart_match'),

  changeMap: (s: Server, map: string) => run(s, `changelevel ${map}`),

  swapTeams: (s: Server) => run(s, 'mp_swapteams'),

  pause: (s: Server) => run(s, 'matchzy_pause'),

  unpause: (s: Server) => run(s, 'matchzy_unpause'),

  startWarmup: (s: Server) => run(s, 'mp_warmup_start'),

  endWarmup: (s: Server) => run(s, 'mp_warmup_end'),

  knifeRound: (s: Server) => run(s, 'matchzy_knife 1'),

  loadMatchFromUrl: (s: Server, url: string) => run(s, `matchzy_loadmatch_url "${url}"`),

  loadMatchFromFile: (s: Server, path: string) => run(s, `matchzy_loadmatch "${path}"`),

  raw: (s: Server, command: string) => run(s, command),
};
