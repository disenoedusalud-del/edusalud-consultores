# Script de Limpieza y Backup - Plataforma EduSalud

Write-Host "Iniciando limpieza y backup..." -ForegroundColor Cyan

# PASO 1: ELIMINAR ARCHIVOS INNECESARIOS
Write-Host "`nEliminando archivos innecesarios..." -ForegroundColor Yellow

$archivosEliminar = @(
    "⚠️_AVISO_PENDIENTE.md",
    "PENDIENTE_CORS.md",
    "CORRECCION_SETHEADER.md",
    "RESUMEN_LIMPIEZA.md",
    "RESUMEN_RAPIDO_ACTUALIZACION.md",
    "REPORTE_ESTADO_ACTUAL.md",
    "REPORTE_RESPALDO_2025.md",
    "DIAGNOSTICO_CERTIFICADOS.md",
    "GUIA_ACTUALIZAR_SCRIPT.md",
    "backup_simple.ps1",
    "crear_backup.ps1"
)

$eliminados = 0
foreach ($archivo in $archivosEliminar) {
    if (Test-Path $archivo) {
        Remove-Item $archivo -Force
        Write-Host "  Eliminado: $archivo" -ForegroundColor Green
        $eliminados++
    }
}

Write-Host "`nEliminados $eliminados archivos innecesarios" -ForegroundColor Green

# PASO 2: CREAR BACKUP COMPRIMIDO
Write-Host "`nCreando backup comprimido..." -ForegroundColor Yellow

$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$nombreBackup = "PLATAFORM_Backup_$fecha"
$rutaEscritorio = [Environment]::GetFolderPath("Desktop")
$rutaZip = Join-Path $rutaEscritorio "$nombreBackup.zip"

# Crear carpeta temporal para el backup
$tempBackup = Join-Path $env:TEMP "backup_temp_$fecha"
New-Item -ItemType Directory -Path $tempBackup -Force | Out-Null

Write-Host "  Carpeta temporal: $tempBackup" -ForegroundColor Gray

# Archivos y carpetas a incluir en el backup
$archivosIncluir = @(
    "index.html",
    "manifest.json",
    "sw.js",
    "package.json",
    "package-lock.json",
    "firebase.json",
    "README_FINAL.md",
    "CONFIGURACION.md",
    "GOOGLE_APPS_SCRIPT_CERTIFICADOS.md",
    "assets",
    "src",
    ".gitignore"
)

# Copiar archivos al backup temporal
foreach ($item in $archivosIncluir) {
    if (Test-Path $item) {
        $destino = Join-Path $tempBackup $item
        if (Test-Path $item -PathType Container) {
            Copy-Item -Path $item -Destination $destino -Recurse -Force
            Write-Host "  Copiada carpeta: $item" -ForegroundColor Green
        } else {
            Copy-Item -Path $item -Destination $destino -Force
            Write-Host "  Copiado archivo: $item" -ForegroundColor Green
        }
    }
}

# Copiar carpeta functions (sin node_modules)
if (Test-Path "functions") {
    $functionsBackup = Join-Path $tempBackup "functions"
    New-Item -ItemType Directory -Path $functionsBackup -Force | Out-Null
    
    Get-ChildItem -Path "functions" -Exclude "node_modules" | ForEach-Object {
        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination $functionsBackup -Recurse -Force
        } else {
            Copy-Item -Path $_.FullName -Destination $functionsBackup -Force
        }
    }
    Write-Host "  Copiada carpeta: functions (sin node_modules)" -ForegroundColor Green
}

# PASO 3: COMPRIMIR BACKUP
Write-Host "`nComprimiendo backup..." -ForegroundColor Yellow

try {
    Compress-Archive -Path "$tempBackup\*" -DestinationPath $rutaZip -Force
    Write-Host "  Backup comprimido creado: $rutaZip" -ForegroundColor Green
    
    $tamano = (Get-Item $rutaZip).Length / 1MB
    Write-Host "  Tamaño del backup: $([math]::Round($tamano, 2)) MB" -ForegroundColor Cyan
    
    Remove-Item -Path $tempBackup -Recurse -Force
    Write-Host "  Carpeta temporal eliminada" -ForegroundColor Gray
} catch {
    Write-Host "  Error al comprimir: $_" -ForegroundColor Red
    $rutaBackup = Join-Path $rutaEscritorio $nombreBackup
    Copy-Item -Path $tempBackup -Destination $rutaBackup -Recurse -Force
    Write-Host "  Backup creado como carpeta: $rutaBackup" -ForegroundColor Green
}

# RESUMEN
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Archivos eliminados: $eliminados" -ForegroundColor White
Write-Host "Backup creado en: $rutaZip" -ForegroundColor White
Write-Host "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
