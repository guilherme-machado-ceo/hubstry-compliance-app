# ═══════════════════════════════════════════════════════════════════════
# Hubstry Compliance — Setup Automático para Vercel
# ═══════════════════════════════════════════════════════════════════════
# Execute no PowerShell dentro da pasta do projeto.
# Requisitos: Node.js 22+, pnpm, Vercel CLI instalado.
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Hubstry Compliance — Vercel Auto Setup            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verificar Vercel CLI ──────────────────────────────────────────
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "[1/5] Instalando Vercel CLI..." -ForegroundColor Yellow
    npm i -g vercel
} else {
    Write-Host "[1/5] Vercel CLI encontrado." -ForegroundColor Green
}

# ── 2. Link do projeto (se ainda não linkado) ─────────────────────────
Write-Host ""
Write-Host "[2/5] Conectando ao Vercel..." -ForegroundColor Yellow
Write-Host "Se perguntar, responda:" -ForegroundColor DarkGray
Write-Host "  - Set up and deploy? → Y" -ForegroundColor DarkGray
Write-Host "  - Link to existing? → N (criar novo projeto)" -ForegroundColor DarkGray
Write-Host ""
vercel link --yes 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Projeto ja pode estar linkado. Continuando..." -ForegroundColor DarkYellow
}

# ── 3. Configurar variáveis de ambiente ──────────────────────────────
Write-Host ""
Write-Host "[3/5] Configurando variaveis de ambiente no Vercel..." -ForegroundColor Yellow

# Função para setar env var no Vercel
function Set-VercelEnv {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Environment = "production,preview,development"
    )
    
    $encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($Value))
    $proc = Start-Process -FilePath "vercel" -ArgumentList "env", "add", $Name, $Environment -Wait -PassThru -NoNewWindow -RedirectStandardInput ([System.IO.StreamWriter]::new([System.IO.MemoryStream]::new())
    # vercel env add requires interactive input, use the pipe approach:
    echo $Value | vercel env add $Name $Environment
}

# ── Configuração do Banco de Dados ────────────────────────────────────
Write-Host ""
Write-Host "════ BANCO DE DADOS ════" -ForegroundColor Cyan
Write-Host "Para Vercel, voce precisa de um banco serverless." -ForegroundColor White
Write-Host "Opcao recomendada: Turso (gratuito, compativel com SQLite)" -ForegroundColor White
Write-Host ""
Write-Host "1. Crie uma conta gratuita em: https://turso.tech" -ForegroundColor Yellow
Write-Host "2. Crie um database: turso db create hubstry-compliance" -ForegroundColor Yellow
Write-Host "3. Copie a URL e o auth token que o Turso te der" -ForegroundColor Yellow
Write-Host ""

$tursoUrl = Read-Host "Cole a URL do Turso (ex: libsql://hubstry-compliance-xxx.turso.io) [Enter para pular]"
if ($tursoUrl -ne "") {
    echo $tursoUrl | vercel env add DATABASE_URL production,preview,development
    echo "sqlite" | vercel env add DATABASE_PROVIDER production,preview,development
    
    $tursoToken = Read-Host "Cole o auth token do Turso"
    echo $tursoToken | vercel env add DATABASE_AUTH_TOKEN production,preview,development
    
    Write-Host "[DB] Turso configurado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "[DB] Pulando configuracao de banco. Configure manualmente no Vercel Dashboard." -ForegroundColor DarkYellow
}

# ── Autenticação ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "════ AUTENTICACAO ════" -ForegroundColor Cyan
Write-Host "Para demo no Vercel, use BYPASS_AUTH + VERCEL_DEMO_MODE." -ForegroundColor White
Write-Host "Para producao real, configure GitHub OAuth." -ForegroundColor White
Write-Host ""

$demoMode = Read-Host "Usar modo demo (sem login)? [S/n]"
if ($demoMode -ne "n" -and $demoMode -ne "N") {
    echo "true" | vercel env add BYPASS_AUTH production,preview,development
    echo "true" | vercel env add VERCEL_DEMO_MODE production,preview,development
    Write-Host "[AUTH] Modo demo ativado." -ForegroundColor Green
} else {
    echo "" | vercel env add BYPASS_AUTH production,preview,development
    echo "" | vercel env add VERCEL_DEMO_MODE production,preview,development
    Write-Host "[AUTH] Modo demo desativado. Configure GitHub OAuth manualmente." -ForegroundColor DarkYellow
}

# JWT Secret
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char][byte]$_})
echo $jwtSecret | vercel env add JWT_SECRET production,preview,development
echo (-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 30 | ForEach-Object {[char][byte]$_})) | vercel env add CRON_SECRET production,preview,development

Write-Host "[AUTH] JWT_SECRET e CRON_SECRET gerados automaticamente." -ForegroundColor Green

# ── GitHub OAuth (opcional) ──────────────────────────────────────────
Write-Host ""
$setupOAuth = Read-Host "Configurar GitHub OAuth agora? [s/N]"
if ($setupOAuth -eq "s" -or $setupOAuth -eq "S") {
    $ghClientId = Read-Host "GitHub Client ID"
    echo $ghClientId | vercel env add GITHUB_CLIENT_ID production,preview,development
    $ghClientSecret = Read-Host "GitHub Client Secret"
    echo $ghClientSecret | vercel env add GITHUB_CLIENT_SECRET production,preview,development
    Write-Host "[AUTH] GitHub OAuth configurado." -ForegroundColor Green
}

# ── Stripe (opcional) ────────────────────────────────────────────────
Write-Host ""
$setupStripe = Read-Host "Configurar Stripe agora? [s/N]"
if ($setupStripe -eq "s" -or $setupStripe -eq "S") {
    $stripeKey = Read-Host "Stripe Secret Key"
    echo $stripeKey | vercel env add STRIPE_SECRET_KEY production,preview,development
    $stripeWebhook = Read-Host "Stripe Webhook Secret"
    echo $stripeWebhook | vercel env add STRIPE_WEBHOOK_SECRET production,preview,development
    $stripeProPrice = Read-Host "Stripe Price ID (Pro)"
    echo $stripeProPrice | vercel env add STRIPE_PRICE_PRO production,preview,development
    $stripeEntPrice = Read-Host "Stripe Price ID (Enterprise)"
    echo $stripeEntPrice | vercel env add STRIPE_PRICE_ENTERPRISE production,preview,development
    Write-Host "[STRIPE] Configurado." -ForegroundColor Green
}

# ── 4. Push do schema no Turso ────────────────────────────────────────
if ($tursoUrl -ne "") {
    Write-Host ""
    Write-Host "[4/5] Fazendo push do schema no Turso..." -ForegroundColor Yellow
    $env:DATABASE_URL = $tursoUrl
    $env:DATABASE_PROVIDER = "sqlite"
    $env:DATABASE_AUTH_TOKEN = $tursoToken
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm db:push:dev 2>$null
        Write-Host "[DB] Schema enviado!" -ForegroundColor Green
    } else {
        Write-Host "[DB] Instale pnpm e rode: pnpm db:push:dev" -ForegroundColor DarkYellow
    }
} else {
    Write-Host ""
    Write-Host "[4/5] Pulando push do schema (banco nao configurado)." -ForegroundColor DarkYellow
}

# ── 5. Deploy ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Fazendo deploy no Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Setup completo!                                   ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Para fazer deploy futuro: vercel --prod" -ForegroundColor White
Write-Host "Para ver logs: vercel logs" -ForegroundColor White
Write-Host "Para ver env vars: vercel env ls" -ForegroundColor White
