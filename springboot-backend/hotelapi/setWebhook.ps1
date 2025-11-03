# Script para configurar el webhook del bot de Telegram
# Uso: .\setWebhook.ps1 -WebhookUrl "https://tu-dominio.com/api/telegram/webhook"

param(
    [Parameter(Mandatory=$true)]
    [string]$WebhookUrl
)

# Verificar que existan las variables de entorno
if (-not $env:TELEGRAM_BOT_TOKEN) {
    Write-Error "Error: La variable de entorno TELEGRAM_BOT_TOKEN no está configurada"
    exit 1
}

$botToken = $env:TELEGRAM_BOT_TOKEN
$secretToken = $env:TELEGRAM_SECRET_TOKEN

Write-Host "Configurando webhook para el bot..." -ForegroundColor Cyan
Write-Host "URL del webhook: $WebhookUrl" -ForegroundColor Yellow

# Preparar el body de la petición
$body = @{
    url = $WebhookUrl
}

# Agregar secret token si está configurado
if ($secretToken) {
    $body.secret_token = $secretToken
    Write-Host "Secret token configurado" -ForegroundColor Green
}

$bodyJson = $body | ConvertTo-Json

# Enviar petición a Telegram
try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook" `
        -Method Post `
        -Body $bodyJson `
        -ContentType "application/json"
    
    if ($response.ok) {
        Write-Host "`n✅ Webhook configurado exitosamente!" -ForegroundColor Green
        Write-Host "Descripción: $($response.description)" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Error al configurar webhook" -ForegroundColor Red
        Write-Host "Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ Error en la petición: $_" -ForegroundColor Red
    exit 1
}

# Verificar el webhook configurado
Write-Host "`nVerificando configuración del webhook..." -ForegroundColor Cyan
try {
    $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/getWebhookInfo"
    
    Write-Host "`n📊 Información del Webhook:" -ForegroundColor Yellow
    Write-Host "URL: $($webhookInfo.result.url)" -ForegroundColor White
    Write-Host "Tiene secret token: $($webhookInfo.result.has_custom_certificate)" -ForegroundColor White
    Write-Host "Pending updates: $($webhookInfo.result.pending_update_count)" -ForegroundColor White
    
    if ($webhookInfo.result.last_error_message) {
        Write-Host "`n⚠️ Último error: $($webhookInfo.result.last_error_message)" -ForegroundColor Yellow
        Write-Host "Fecha: $($webhookInfo.result.last_error_date)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error al obtener información del webhook: $_" -ForegroundColor Red
}

Write-Host "`n✨ Configuración completada" -ForegroundColor Green
