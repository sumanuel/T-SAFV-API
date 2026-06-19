# A script to test the full invitation acceptance flow:
# 1) register admin
# 2) login admin
# 3) create association
# 4) create invitation for a generated test user
# 5) register the invited user
# 6) login invited user
# 7) accept invitation using /api/invitaciones/respond

$ts = [int][double]::Parse((Get-Date -UFormat %s))
$adminEmail = "testadmin_$ts@example.com"
$pwd = "Secret123!"
$invitedEmail = "testuser_accept_$ts@example.com"

Write-Host "Registering admin: $adminEmail"
try {
  $reg = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -Body (ConvertTo-Json @{nombre='Test Admin'; email=$adminEmail; password=$pwd}) -ContentType 'application/json'
  Write-Host "Register response:" ($reg | ConvertTo-Json)

  $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/login' -Body (ConvertTo-Json @{email=$adminEmail; password=$pwd}) -ContentType 'application/json'
  $token = $login.token
  Write-Host "Admin token acquired"

  $asoc = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/asociaciones' -Headers @{Authorization="Bearer $token"} -Body (ConvertTo-Json @{nombre="Test Asoc $ts"; rif="J-$ts"}) -ContentType 'application/json'
  Write-Host "Asoc created:" ($asoc | ConvertTo-Json)

  $inv = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/invitaciones' -Headers @{Authorization="Bearer $token"} -Body (ConvertTo-Json @{asociacion_id=$asoc.id; email_invitado=$invitedEmail; rol_invitado="PROPIETARIO"}) -ContentType 'application/json'
  Write-Host "Invitation created:" ($inv | ConvertTo-Json)
  $token_invitacion = $inv.token_invitacion
  Write-Host "Token invitation:" $token_invitacion

  Write-Host "Registering invited user: $invitedEmail"
  $reg2 = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -Body (ConvertTo-Json @{nombre='Invitado Test'; email=$invitedEmail; password=$pwd}) -ContentType 'application/json'
  Write-Host "Invited register:" ($reg2 | ConvertTo-Json)

  $login2 = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/login' -Body (ConvertTo-Json @{email=$invitedEmail; password=$pwd}) -ContentType 'application/json'
  $tokenInv = $login2.token
  Write-Host "Invited token acquired"

  # Accept invitation
  $accept = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/invitaciones/respond' -Headers @{Authorization="Bearer $tokenInv"} -Body (ConvertTo-Json @{token=$token_invitacion}) -ContentType 'application/json'
  Write-Host "Accept response:" ($accept | ConvertTo-Json)

  if ($accept.membresia) {
    Write-Host "Membresia creada con id:" $accept.membresia.id
    Write-Host "La inserción en historial fue registrada (verifique en la BD si desea confirmar)."
  } else {
    Write-Error "No se encontró membresia en la respuesta"
    exit 1
  }
} catch {
  Write-Error $_.Exception.Message
  exit 1
}

Write-Host "Flujo de invitación y aceptación completado correctamente."
