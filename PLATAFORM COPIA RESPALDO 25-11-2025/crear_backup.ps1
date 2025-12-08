$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$source = 'C:\Users\Daniel\Desktop\PLATAFORM'
$destination = "C:\Users\Daniel\Desktop\PLATAFORM_BACKUP_$timestamp.zip"

Compress-Archive -Path "$source\*" -DestinationPath $destination -Force

Write-Host "Backup creado exitosamente: PLATAFORM_BACKUP_$timestamp.zip"
Write-Host "Tamaño: $((Get-Item $destination).Length / 1MB) MB"

