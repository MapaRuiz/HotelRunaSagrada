# Script para eliminar el webhook del bot de Telegram
# Esto permite usar el bot en modo polling (útil para desarrollo local)
# Uso: .\deleteWebhook.ps1

# Verificar que exista la variable de entorno
if (-not $env:TELEGRAM_BOT_TOKEN) {
    Write-Error "Error: La variable de entorno TELEGRAM_BOT_TOKEN no está configurada"
    exit 1
}

$botToken = $env:TELEGRAM_BOT_TOKEN

Write-Host "Eliminando webhook del bot..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/deleteWebhook"
    
    if ($response.ok) {
        Write-Host "`n✅ Webhook eliminado exitosamente!" -ForegroundColor Green
        Write-Host "Descripción: $($response.description)" -ForegroundColor Green
        Write-Host "`nAhora puedes usar el bot en modo polling (desarrollo local)" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ Error al eliminar webhook" -ForegroundColor Red
        Write-Host "Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ Error en la petición: $_" -ForegroundColor Red
    exit 1
}
