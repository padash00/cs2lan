import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  bigserial,
} from 'drizzle-orm/pg-core';

export const servers = pgTable('servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  host: text('host').notNull(),
  port: integer('port').notNull().default(27015),
  rconPassword: text('rcon_password').notNull(),
  gsltToken: text('gslt_token'),
  status: text('status', { enum: ['online', 'offline', 'in_use'] })
    .notNull()
    .default('offline'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  team1Name: text('team1_name').notNull(),
  team2Name: text('team2_name').notNull(),
  serverId: uuid('server_id').references(() => servers.id, { onDelete: 'set null' }),
  bestOf: integer('best_of').notNull().default(1),
  status: text('status', { enum: ['pending', 'live', 'finished'] })
    .notNull()
    .default('pending'),
  matchzyId: text('matchzy_id'),
  score1: integer('score1').notNull().default(0),
  score2: integer('score2').notNull().default(0),
  mapPool: jsonb('map_pool').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const matchEvents = pgTable('match_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }),
  serverId: uuid('server_id').references(() => servers.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type MatchEvent = typeof matchEvents.$inferSelect;
