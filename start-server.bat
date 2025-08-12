@echo off
echo Iniciando ProductionTracker Server...
echo Database: PostgreSQL
echo.

set NODE_ENV=development
set DATABASE_URL=postgres://app_producao:@Wsr461300321321@54.242.187.130:5432/app-producao-postegres?sslmode=disable

echo Variaveis de ambiente configuradas.
echo Iniciando servidor na porta 5000...
echo.

npx tsx server/index.ts

pause 