# Установка CS2 Dedicated Server на Windows

Эта инструкция — для твоего Windows-ПК, на котором будет крутиться сам CS2-сервер.
Бэкенд и фронт работают на маке. Обе машины должны быть в одной локалке.

---

## 0. Что понадобится

- **Windows 10/11** (x64)
- **~40 ГБ** свободного места
- **8 ГБ RAM** минимум
- Открытые порты: **27015 TCP/UDP** (RCON + game)
- Локальный IP винды — узнай через `ipconfig` (например `192.168.1.50`)
- IP мака в той же сети (например `192.168.1.10`) — на нём слушает бэкенд на порту 3001

---

## 1. Установка SteamCMD

1. Создай папку: `C:\steamcmd`
2. Скачай: <https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip>
3. Распакуй в `C:\steamcmd`
4. Запусти `C:\steamcmd\steamcmd.exe` — он сам скачает обновления. Дождись `Steam>` промпта.

---

## 2. Установка CS2 Dedicated Server

В окне SteamCMD по очереди введи:

```
login anonymous
force_install_dir C:\cs2server
app_update 730 validate
```

Скачается ~30 ГБ. После завершения:
```
quit
```

Проверь, что есть файл: `C:\cs2server\game\bin\win64\cs2.exe`

---

## 3. Установка Metamod:Source

CS2-сборка Metamod нужна — без неё CounterStrikeSharp не загрузится.

1. Скачай **последнюю dev-сборку для CS2**: <https://www.sourcemm.net/downloads.php?branch=master>
   (нужен `mmsource-*-windows.zip` со снапшота, поддерживающего CS2 / Source 2)
2. Распакуй содержимое архива в:
   ```
   C:\cs2server\game\csgo\
   ```
   Должна появиться папка `C:\cs2server\game\csgo\addons\metamod\`

3. **Важно**: отредактируй `C:\cs2server\game\csgo\gameinfo.gi`.
   Найди блок `FileSystem { SearchPaths { ... } }` и **в самый верх** SearchPaths добавь строку:
   ```
   Game	csgo/addons/metamod
   ```
   (символ — табуляция между `Game` и путём, не пробелы)

4. Проверить что Metamod подхватился можно потом, командой `meta version` в консоли сервера.

---

## 4. Установка CounterStrikeSharp (CSS)

1. Скачай **последний релиз for Windows with runtime**: <https://github.com/roflmuffin/CounterStrikeSharp/releases>
   Файл вида `counterstrikesharp-with-runtime-build-XXX-windows-...zip`
2. Распакуй содержимое в:
   ```
   C:\cs2server\game\csgo\
   ```
   Появятся:
   - `C:\cs2server\game\csgo\addons\counterstrikesharp\`
   - `C:\cs2server\game\csgo\addons\metamod\counterstrikesharp.vdf`

---

## 5. Установка MatchZy

1. Скачай **последний релиз**: <https://github.com/shobhit-pathak/MatchZy/releases>
   Файл `MatchZy-vX.X.X.zip`
2. Распакуй в:
   ```
   C:\cs2server\game\csgo\addons\counterstrikesharp\
   ```
   Должны появиться:
   - `addons\counterstrikesharp\plugins\MatchZy\MatchZy.dll`
   - `addons\counterstrikesharp\configs\plugins\MatchZy\` (создастся при первом запуске)

---

## 6. Копирование конфигов из репо

На маке у тебя в `~/Desktop/cs2/gameserver/cfg/` лежат готовые конфиги. Скопируй их на винду.

**Что куда:**

| Из репо (на маке)                       | Куда на винде                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `gameserver/cfg/server.cfg`             | `C:\cs2server\game\csgo\cfg\server.cfg`                                                    |
| `gameserver/cfg/matchzy/matchzy.cfg`    | `C:\cs2server\game\csgo\cfg\MatchZy\config.cfg` (создастся папка после первого запуска MatchZy) |
| `gameserver/cfg/matchzy/warmup.cfg`     | `C:\cs2server\game\csgo\cfg\MatchZy\warmup.cfg`                                            |
| `gameserver/cfg/matchzy/knife.cfg`      | `C:\cs2server\game\csgo\cfg\MatchZy\knife.cfg`                                             |
| `gameserver/cfg/matchzy/live.cfg`       | `C:\cs2server\game\csgo\cfg\MatchZy\live.cfg`                                              |
| `gameserver/start-server.bat`           | `C:\cs2server\start-server.bat`                                                            |

Передать можно как удобно: флешка, AirDrop через iCloud, общая папка SMB, или просто `scp` если на винде установлен OpenSSH.

---

## 7. Настройка `server.cfg` и `matchzy.cfg`

Открой `C:\cs2server\game\csgo\cfg\server.cfg` блокнотом и **обязательно поменяй**:

```cfg
hostname "My Tournament Server #1"
rcon_password "ПОСТАВЬ_СВОЙ_СЛОЖНЫЙ_ПАРОЛЬ"   // тот же запишешь в .env на маке
sv_password ""                                  // пусто = открытый, или поставь пароль на коннект
```

Открой `C:\cs2server\game\csgo\cfg\MatchZy\config.cfg` и **обязательно поменяй URL/токен**:

```cfg
matchzy_remote_log_url "http://192.168.1.10:3001/webhooks/matchzy"   // IP МАКА
matchzy_remote_log_header_key "X-Auth-Token"
matchzy_remote_log_header_value "ПОСТАВЬ_ТОТ_ЖЕ_ТОКЕН_ЧТО_В_БЭКЕНДЕ"
```

Замени `192.168.1.10` на реальный IP мака (`ipconfig getifaddr en0` в терминале мака).

---

## 8. Открытие портов в Windows Firewall

PowerShell от админа:

```powershell
New-NetFirewallRule -DisplayName "CS2 Server UDP 27015" -Direction Inbound -Protocol UDP -LocalPort 27015 -Action Allow
New-NetFirewallRule -DisplayName "CS2 Server TCP 27015 (RCON)" -Direction Inbound -Protocol TCP -LocalPort 27015 -Action Allow
```

Если играешь только в LAN — этого достаточно. Если хочешь пускать игроков из интернета — пробрось 27015 UDP на роутере на винду + получи GSLT-токен (см. секцию 11).

---

## 9. Запуск сервера

Дважды кликни `C:\cs2server\start-server.bat`. Должно появиться окно консоли с логом.

Что должно быть в логе **успешного** запуска:
- `Network socket 'public_game' opened on port 27015`
- `Metamod:Source loaded` (если не видно — Metamod не подцепился)
- `[CounterStrikeSharp] CoreConfig.json file not found ...` (нормально при первом запуске)
- `[MatchZy] Plugin loaded successfully!`
- `[MatchZy] Plugin version: X.X.X`

---

## 10. Проверка с мака

С мака пинганём винду и проверим RCON.

```bash
# 1. Проверка сети
ping 192.168.1.50

# 2. Проверка что порт открыт
nc -zv 192.168.1.50 27015

# 3. Проверка RCON (когда бэкенд готов, через UI)
# Либо вручную утилитой rcon:
brew install n0la/tap/rcon
rcon -H 192.168.1.50 -p 27015 -P 'твой_rcon_пароль' 'status'
```

Если `status` вернул список игроков — связь работает, RCON живой.

---

## 11. (Опционально) GSLT-токен для интернет-сервера

Если планируешь пускать игроков из интернета, нужен Game Server Login Token:

1. Зайди: <https://steamcommunity.com/dev/managegameservers>
2. App ID: **730**
3. Memo: любое имя, например `cs2-tournament-1`
4. Получишь токен — добавь в `start-server.bat` параметр `+sv_setsteamaccount ТВОЙ_ТОКЕН`
5. В `server.cfg` убери `sv_lan 1` или поставь `sv_lan 0`

---

## 12. Troubleshooting

| Симптом                                        | Решение                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `cs2.exe` не запускается                       | Запусти SteamCMD ещё раз: `app_update 730 validate`                    |
| Нет `Metamod:Source loaded` в логе             | Проверь `gameinfo.gi` — строку `Game csgo/addons/metamod` с табуляцией |
| `[MatchZy] Plugin loaded` не появляется        | Проверь `addons\counterstrikesharp\plugins\MatchZy\MatchZy.dll`        |
| MatchZy не шлёт webhooks                       | Проверь IP мака в `config.cfg`, проверь что мак-фаервол не блочит 3001 |
| RCON не коннектится с мака                     | Проверь `rcon_password` совпадает в `server.cfg` и `.env` бэкенда      |
| `nc -zv` говорит refused                       | Firewall на винде блочит, перепроверь правила                          |
| После апдейта CS2 плагины слетели              | Перекачай новую сборку Metamod/CSS/MatchZy — Valve ломает ABI частенько|

---

## 13. Обновление сервера

После обновления CS2 (Valve патчит):
1. `cd C:\steamcmd && steamcmd.exe`
2. `app_update 730 validate`
3. **Скорее всего** придётся обновить Metamod / CounterStrikeSharp / MatchZy (по версиям из их репо).
