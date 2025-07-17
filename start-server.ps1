Write-Host "🚀 Iniciando ProductionTracker Server..." -ForegroundColor Green
Write-Host "📊 Database: PostgreSQL Neon" -ForegroundColor Cyan
Write-Host ""

# Configurar variáveis de ambiente
$env:NODE_ENV = "development"
$env:DATABASE_URL = "postgresql://neondb_owner:npg_qSg8tT6rAhBm@ep-icy-dream-aejlgclo-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`&channel_binding=require"

Write-Host "✅ Variáveis de ambiente configuradas:" -ForegroundColor Green
Write-Host "   NODE_ENV = $env:NODE_ENV" -ForegroundColor Yellow
Write-Host "   DATABASE_URL = [CONFIGURED]" -ForegroundColor Yellow
Write-Host ""

# Verificar se o tsx está disponível
Write-Host "🔍 Verificando dependências..." -ForegroundColor Blue
try {
    $tsxVersion = npx tsx --version
    Write-Host "✅ TSX disponível: $tsxVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: TSX não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Iniciando servidor na porta 5002..." -ForegroundColor Green
Write-Host "📝 Logs do servidor:" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Gray

# Iniciar o servidor
npx tsx server/index.ts 