# CS2 Tournament Platform — Полный план

Самохостинговая турнирная платформа уровня PGL/ESL/FACEIT для CS2.
Управление матчем и сервером из веб-панели: ножевой раунд, смена сторон, пауза,
рестарт раунда/карты, BO1/BO3/BO5, турнирная сетка, статы, демо.

---

## 1. Архитектура

```
┌────────────────────────┐         ┌────────────────────────┐
│   Frontend (web/)      │ ◄─WS──► │   Backend (server/)    │
│   Next.js 15           │ ◄─HTTP─►│   Fastify + TypeScript │
│   • /admin/* панель    │         │   • REST API           │
│   • /match/[id] live   │         │   • WebSocket          │
│   • /tournament сетка  │         │   • RCON client        │
└────────────────────────┘         │   • MatchZy webhooks   │
                                   └───────────┬────────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                       RCON (TCP)        Webhooks (HTTP)   SQL
                              │                │                │
                              ▼                │                ▼
                ┌──────────────────────┐       │       ┌──────────────┐
                │  CS2 Dedicated       │       │       │  PostgreSQL  │
                │  Server (Windows)    │───────┘       │  (Docker на  │
                │  + Metamod:Source    │               │   маке)      │
                │  + CounterStrikeSharp│               └──────────────┘
                │  + MatchZy plugin    │
                └──────────────────────┘
                              │
                              ▼
                       *.dem файлы
                              │
                              ▼
                  ┌────────────────────────┐
                  │  Stats parser (Go)     │
                  │  demoinfocs-golang     │
                  └────────────────────────┘
```

**Поток данных:**
1. Админ кликает «Restart round» во фронте.
2. Фронт → `POST /api/servers/:id/cmd/restart-round` на бэк.
3. Бэк по RCON отправляет `mp_restartgame 1` на CS2-сервер.
4. CS2-сервер (через MatchZy) шлёт webhook на бэк: `POST /webhooks/matchzy/event` (round_end, going_live, knife_won, match_end и т.д.).
5. Бэк пишет событие в Postgres и пушит обновление всем подключённым клиентам через WebSocket.
6. Фронт обновляет UI в реальном времени.

---

## 2. Стек

| Слой           | Технология                                              |
| -------------- | ------------------------------------------------------- |
| Game server    | CS2 Dedicated Server (Windows) + Metamod:Source + CounterStrikeSharp + MatchZy |
| Backend        | Node.js 20+, TypeScript, Fastify, `@fastify/websocket`, `rcon-client` |
| ORM / DB       | Drizzle ORM + PostgreSQL 16 (в Docker)                 |
| Frontend       | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Realtime       | WebSocket (Fastify ws)                                  |
| Stats parser   | Go + `demoinfocs-golang`                                |
| Менеджер пакетов | pnpm workspaces                                       |
| Контейнеры     | Docker Compose (только для Postgres локально)           |

---

## 3. Структура репозитория

```
cs2/
├── PLAN.md                  ← этот файл
├── WINDOWS_SETUP.md         ← инструкция по установке CS2-сервера
├── README.md                ← быстрый старт
├── package.json             ← корень workspace
├── pnpm-workspace.yaml
├── docker-compose.yml       ← Postgres
├── .env.example
├── .gitignore
│
├── server/                  ← Backend (Fastify)
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   └── src/
│       ├── index.ts         ← entry: запускает Fastify
│       ├── config.ts        ← env-конфиг
│       ├── db/
│       │   ├── index.ts     ← Drizzle клиент
│       │   └── schema.ts    ← таблицы (servers, matches, match_events)
│       ├── rcon/
│       │   ├── client.ts    ← пул RCON-соединений
│       │   └── commands.ts  ← helpers (restartRound, swapTeams, …)
│       ├── matchzy/
│       │   ├── types.ts     ← типы событий
│       │   └── webhooks.ts  ← Fastify-роут /webhooks/matchzy
│       ├── api/
│       │   ├── servers.ts   ← CRUD + команды серверу
│       │   ├── matches.ts   ← CRUD матчей, загрузка в MatchZy
│       │   └── teams.ts     ← (P2)
│       └── ws/
│           └── index.ts     ← WS-хаб, broadcast по match-id
│
├── web/                     ← Frontend (Next.js)
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx               ← главная (список матчей)
│   │   ├── admin/
│   │   │   ├── page.tsx           ← список серверов
│   │   │   └── server/[id]/
│   │   │       └── page.tsx       ← панель управления матчем
│   │   └── match/[id]/
│   │       └── page.tsx           ← публичная лайв-страница
│   ├── components/
│   │   ├── match-controls.tsx     ← кнопки restart/pause/swap/knife
│   │   ├── live-score.tsx
│   │   └── ui/                    ← shadcn компоненты
│   └── lib/
│       ├── api.ts                 ← REST-клиент
│       └── ws.ts                  ← WS-хук
│
├── gameserver/              ← НЕ запускается на маке — копируй на винду
│   ├── README.md
│   ├── cfg/
│   │   ├── server.cfg             ← базовый конфиг сервера
│   │   ├── matchzy/
│   │   │   ├── warmup.cfg
│   │   │   ├── knife.cfg
│   │   │   ├── live.cfg
│   │   │   └── matchzy.cfg        ← cvars MatchZy (webhook URL и т.д.)
│   ├── matches/
│   │   └── example-match.json     ← шаблон матча для matchzy_loadmatch
│   └── start-server.bat
│
└── stats-parser/            ← (P4) Go-парсер демок
    ├── go.mod
    └── main.go
```

---

## 4. Фазы реализации

Полный FACEIT — это месяцы. Делаем фазами, каждая = рабочий продукт.

### P1. Match control MVP (≈ неделя)
**Цель:** один CS2-сервер, одна кнопочная панель — управляем матчем из браузера.

- [ ] Postgres в docker-compose, миграции Drizzle
- [ ] CRUD `servers` (host, port, rcon_password, gslt)
- [ ] RCON-клиент с пулом соединений
- [ ] REST endpoints для команд: `restart-round`, `restart-map`, `change-map`, `pause`, `unpause`, `swap-teams`, `knife-round`, `start-match`
- [ ] MatchZy webhook listener: принимает `Round_End`, `Going_Live`, `Knife_Won`, `Map_Result`, `Series_Result`
- [ ] WebSocket: broadcast событий по match-id
- [ ] Frontend `/admin/server/[id]`: статус сервера, кнопки, лайв-счёт, лог событий

### P2. Матчи + команды + загрузка (≈ неделя)
- [ ] `teams`, `players` (Steam ID), CRUD
- [ ] Создание матча в UI: выбор двух команд, BO1/BO3/BO5, map pool
- [ ] Генерация `match.json` для MatchZy
- [ ] Загрузка матча на сервер: `matchzy_loadmatch_url <backend-url>` — бэк отдаёт JSON, плагин его сосёт
- [ ] Сохранение результатов карт в `match_maps`

### P3. Турнирная сетка (≈ неделя)
- [ ] `tournaments` (single elim / double elim / round robin)
- [ ] Генератор сетки + автосоздание матчей при продвижении
- [ ] Публичная страница турнира с brackets-визуализацией
- [ ] Назначение свободных серверов на матчи

### P4. Статы (1-2 недели)
- [ ] Go-парсер демок на `demoinfocs-golang` → JSON
- [ ] Запуск парсера после `Map_Result` webhook (демку забираем по FTP/HTTP с винды или просим MatchZy зашарить)
- [ ] Таблицы `player_stats` (K/D/A, ADR, HS%, KAST, HLTV 2.0 rating)
- [ ] UI: статистика игрока, статистика команды, scoreboard матча

### P5. Демо-плеер в браузере (месяц+)
- [ ] Начать с простого: страница матча → кнопка «Скачать .dem» + кнопка «Открыть heatmap»
- [ ] Затем — 2D радар: парсим демку в позиции по тикам, рендерим на canvas (по примеру csstats.gg / leetify)
- [ ] Веб-плеер с таймлайном раундов — последняя итерация

---

## 5. Data model (минимум для P1+P2)

```sql
-- P1
servers (
  id UUID PK,
  name TEXT,
  host TEXT,                  -- IP в LAN, например 192.168.1.50
  port INT,                   -- 27015
  rcon_password TEXT,
  gslt_token TEXT NULL,       -- для интернета, для LAN не нужен
  status TEXT,                -- 'online'|'offline'|'in_use'
  created_at TIMESTAMPTZ
)

matches (
  id UUID PK,
  team1_name TEXT,
  team2_name TEXT,
  server_id UUID FK,
  best_of INT,                -- 1, 3, 5
  status TEXT,                -- 'pending'|'live'|'finished'
  matchzy_id TEXT NULL,       -- ID матча в MatchZy
  score1 INT DEFAULT 0,
  score2 INT DEFAULT 0,
  created_at, started_at, finished_at
)

match_events (
  id BIGSERIAL PK,
  match_id UUID FK,
  type TEXT,                  -- 'round_end' | 'going_live' | ...
  payload JSONB,              -- raw MatchZy webhook payload
  created_at TIMESTAMPTZ
)

-- P2
teams (id, name, tag, logo_url, created_at)
players (id, team_id FK, steam_id, nickname, country, created_at)
match_maps (id, match_id FK, map_name, "order", team1_score, team2_score, winner_team_id, side_picker_team_id)

-- P3
tournaments (id, name, format, status, created_at)
tournament_matches (id, tournament_id FK, match_id FK, round, bracket_position)

-- P4
player_match_stats (id, match_id FK, player_id FK, kills, deaths, assists, adr, hs_pct, kast, rating, ...)
```

---

## 6. REST API (P1)

| Метод  | Путь                                    | Описание                            |
| ------ | --------------------------------------- | ----------------------------------- |
| GET    | `/api/servers`                          | список серверов                     |
| POST   | `/api/servers`                          | добавить сервер                     |
| GET    | `/api/servers/:id`                      | детали + статус                     |
| POST   | `/api/servers/:id/cmd/restart-round`    | `mp_restartgame 1`                  |
| POST   | `/api/servers/:id/cmd/restart-map`      | перезапуск с warmup                 |
| POST   | `/api/servers/:id/cmd/change-map`       | `changelevel <map>`                 |
| POST   | `/api/servers/:id/cmd/pause`            | `matchzy_pause`                     |
| POST   | `/api/servers/:id/cmd/unpause`          | `matchzy_unpause`                   |
| POST   | `/api/servers/:id/cmd/swap-teams`       | `mp_swapteams`                      |
| POST   | `/api/servers/:id/cmd/knife-round`      | запустить knife через MatchZy       |
| POST   | `/api/servers/:id/cmd/raw`              | произвольная RCON-команда (admin-only) |
| GET    | `/api/matches`                          | список матчей                       |
| POST   | `/api/matches`                          | создать матч                        |
| GET    | `/api/matches/:id`                      | детали + события                    |
| POST   | `/api/matches/:id/start`                | загрузить матч в MatchZy, начать    |
| GET    | `/api/matches/:id/matchzy.json`         | MatchZy подсасывает этот URL        |
| POST   | `/webhooks/matchzy`                     | MatchZy шлёт сюда события           |
| WS     | `/ws/match/:id`                         | live-обновления для одного матча    |

---

## 7. MatchZy webhook payloads

MatchZy шлёт `POST` JSON. Основные типы события (поле `event`):

| Event           | Когда                          | Используем для                |
| --------------- | ------------------------------ | ----------------------------- |
| `series_start`  | начало серии                   | пометить матч как `live`      |
| `going_live`    | конец warmup, начало live      | стартануть таймер             |
| `round_end`     | конец каждого раунда           | обновить счёт                 |
| `side_picked`   | команда выбрала сторону        | сохранить в `match_maps`      |
| `map_picked`    | пик карты                      | сохранить в `match_maps`      |
| `map_result`    | конец карты                    | финализировать `match_maps`   |
| `series_result` | конец серии                    | пометить матч как `finished`  |
| `knife_won`     | результат ножевого             | UI-уведомление                |
| `player_say`    | сообщение в чате (опц.)        | модерация                     |

Конфигурируется в `gameserver/cfg/matchzy/matchzy.cfg`:
```
matchzy_remote_log_url "http://<твой-mac-ip>:3001/webhooks/matchzy"
matchzy_remote_log_header_key "X-Auth-Token"
matchzy_remote_log_header_value "supersecret"
```

---

## 8. Топология деплоя

**Dev (сейчас):**
- Мак — Postgres (Docker), backend (`pnpm dev`), frontend (`pnpm dev`)
- Винда — CS2 dedicated server + MatchZy
- Обе машины в одной локалке. Например: мак 192.168.1.10, винда 192.168.1.50

**Production-LAN (когда поедешь на турнир):**
- Один сервер (мини-PC / ноут) в локалке: Postgres + backend + frontend (через nginx/caddy)
- Один или несколько Windows-машин с CS2-серверами
- Зрители подключаются к фронту по IP сервера

---

## 9. Что нужно сделать на каждой машине

### На маке (этот репо):
1. `cd ~/Desktop/cs2`
2. Установить pnpm и Docker Desktop (см. README)
3. `cp .env.example .env` и заполнить `RCON_*` под винду
4. `docker compose up -d` — поднимет Postgres
5. `pnpm install`
6. `pnpm --filter server db:push` — создаст таблицы
7. `pnpm dev` — стартанёт backend + frontend
8. Открыть http://localhost:3000

### На винде:
См. `WINDOWS_SETUP.md` — там по шагам:
1. SteamCMD
2. CS2 dedicated server (app 730)
3. Metamod:Source
4. CounterStrikeSharp
5. MatchZy
6. Конфиги (из `gameserver/cfg/`)
7. Открыть порты (27015 UDP, 27015 TCP)
8. `start-server.bat`
