@echo off
REM ─────────────────────────────────────────────────────────────
REM  CS2 Tournament Server — launcher
REM  Положить в: C:\cs2server\start-server.bat
REM ─────────────────────────────────────────────────────────────

cd /d "C:\cs2server\game\bin\win64"

REM Если хочешь публичный сервер — добавь +sv_setsteamaccount ТВОЙ_GSLT
REM и в server.cfg поставь sv_lan 0

cs2.exe -dedicated -console -usercon ^
    -port 27015 ^
    +game_type 0 +game_mode 1 ^
    +mapgroup mg_active ^
    +map de_mirage ^
    +exec server.cfg ^
    -insecure

pause
