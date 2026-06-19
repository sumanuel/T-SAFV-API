$ts = [int][double]::Parse((Get-Date -UFormat %s))
$adminEmail = "testadmin_$ts@example.com"
$pwd = "Secret123!"
Write-Host "Registering: $adminEmail"
try {
  $reg = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -Body (ConvertTo-Json @{nombre='Test Admin'; email=$adminEmail; password=$pwd}) -ContentType 'application/json'
  Write-Host "Register response:" ($reg | ConvertTo-Json)
  $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/login' -Body (ConvertTo-Json @{email=$adminEmail; password=$pwd}) -ContentType 'application/json'
  $token = $login.token
  Write-Host "Token:" $token
  $asoc = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/asociaciones' -Headers @{Authorization="Bearer $token"} -Body (ConvertTo-Json @{nombre="Test Asoc $ts"; rif="J-$ts"}) -ContentType 'application/json'
  Write-Host "Asoc:" ($asoc | ConvertTo-Json)
  $inv = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/invitaciones' -Headers @{Authorization="Bearer $token"} -Body (ConvertTo-Json @{asociacion_id=$asoc.id; email_invitado="contacto.sumadev@gmail.com"; rol_invitado="PROPIETARIO"}) -ContentType 'application/json'
  Write-Host "Invitacion:" ($inv | ConvertTo-Json)
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
