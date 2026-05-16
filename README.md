# CS2 Tournament Platform

Самохостинговая платформа уровня PGL/ESL/FACEIT для CS2 — управление турниром
и матчами из браузера: ножевой раунд, смена сторон, пауза, рестарт, BO1/BO3/BO5,
турнирная сетка, статы, демо.

> **Документация:**
> - [PLAN.md](./PLAN.md) — полный план, архитектура, фазы, API
> - [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) — установка CS2-сервера на Windows

---

## Быстрый старт (мак — dev-окружение)

### Prerequisites

- **Node.js 20+**: `brew install node@20`
- **pnpm**: `npm i -g pnpm`
- **Docker Desktop**: <https://www.docker.com/products/docker-desktop/>

### Установка

```bash
cd ~/Desktop/cs2
cp .env.example .env
# открой .env, заполни RCON_HOST = IP твоей винды (например 192.168.1.50)
# заполни RCON_PASSWORD = тот же что в server.cfg на винде
# заполни MATCHZY_WEBHOOK_TOKEN = тот же что в matchzy.cfg на винде

docker compose up -d                    # Postgres
pnpm install
pnpm --filter server db:push            # создаст таблицы
pnpm dev                                # backend на :3001, frontend на :3000
```

Открой: <http://localhost:3000/admin>

### CS2-сервер

Файлы для CS2-сервера лежат в `gameserver/`. На винде ставь по [WINDOWS_SETUP.md](./WINDOWS_SETUP.md).

---

## Структура

```
cs2/
├── PLAN.md             полный план
├── WINDOWS_SETUP.md    инструкция для CS2-сервера
├── server/             backend (Fastify + TS)
├── web/                frontend (Next.js)
├── gameserver/         конфиги для CS2-сервера (копируешь на винду)
└── docker-compose.yml  Postgres локально
```

## Текущая фаза: P1 — match control MVP

См. [PLAN.md → Фазы](./PLAN.md#4-фазы-реализации).
