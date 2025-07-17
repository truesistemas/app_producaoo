@echo off
echo Iniciando ProductionTracker Server...
echo Database: PostgreSQL Neon
echo.

set NODE_ENV=development
set DATABASE_URL=postgresql://neondb_owner:npg_qSg8tT6rAhBm@ep-icy-dream-aejlgclo-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require^&channel_binding=require

echo Variaveis de ambiente configuradas.
echo Iniciando servidor na porta 5000...
echo.

npx tsx server/index.ts

pause 