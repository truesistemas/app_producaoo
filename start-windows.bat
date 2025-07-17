@echo off
cls
echo.
echo ============================================
echo    ProductionTracker - Windows Startup
echo ============================================
echo Database: PostgreSQL Neon
echo Port: 5002
echo Host: localhost
echo.

echo [1/3] Configurando variaveis de ambiente...
set NODE_ENV=development
set "DATABASE_URL=postgresql://neondb_owner:npg_qSg8tT6rAhBm@ep-icy-dream-aejlgclo-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
echo ✓ NODE_ENV = %NODE_ENV%
echo ✓ DATABASE_URL = [CONFIGURADO]
echo.

echo [2/3] Verificando dependencias...
npx tsx --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ ERRO: TSX nao encontrado
    echo Executando: npm install
    npm install
)
echo ✓ Dependencias OK
echo.

echo [3/3] Iniciando servidor...
echo ============================================
echo Acesse: http://localhost:5002
echo Pressione Ctrl+C para parar o servidor
echo ============================================
echo.

npx tsx server/index.ts 