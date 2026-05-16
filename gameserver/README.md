# gameserver/

Эти файлы НЕ запускаются на маке. Это конфиги, которые ты копируешь на
Windows-ПК где крутится CS2 dedicated server.

Полная инструкция по установке: [`../WINDOWS_SETUP.md`](../WINDOWS_SETUP.md)

## Что куда копировать

| Файл                        | Назначение на Windows                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `cfg/server.cfg`            | `C:\cs2server\game\csgo\cfg\server.cfg`                             |
| `cfg/matchzy/config.cfg`    | `C:\cs2server\game\csgo\cfg\MatchZy\config.cfg`                     |
| `cfg/matchzy/warmup.cfg`    | `C:\cs2server\game\csgo\cfg\MatchZy\warmup.cfg`                     |
| `cfg/matchzy/knife.cfg`     | `C:\cs2server\game\csgo\cfg\MatchZy\knife.cfg`                      |
| `cfg/matchzy/live.cfg`      | `C:\cs2server\game\csgo\cfg\MatchZy\live.cfg`                       |
| `matches/example-match.json`| `C:\cs2server\game\csgo\cfg\MatchZy\matches\example-match.json` (опц.) |
| `start-server.bat`          | `C:\cs2server\start-server.bat`                                     |

## ОБЯЗАТЕЛЬНО поменять перед первым запуском

1. **`cfg/server.cfg`**: `rcon_password` — поставь свой длинный пароль
2. **`cfg/matchzy/config.cfg`**:
   - `matchzy_remote_log_url` — впиши IP мака в LAN, например `http://192.168.1.10:3001/webhooks/matchzy`
   - `matchzy_remote_log_header_value` — поставь тот же токен, что в `.env` бэкенда

## Тестовая загрузка матча

После запуска сервера в его консоли:
```
matchzy_loadmatch addons/counterstrikesharp/configs/plugins/MatchZy/matches/example-match.json
```

(Или через UI: создать матч → Start match — бэкенд автоматически отдаст MatchZy JSON.)
