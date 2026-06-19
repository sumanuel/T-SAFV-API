$ts = [int][double]::Parse((Get-Date -UFormat %s))
$email = "testadmin_debug_$ts@example.com"
$body = @{nombre='Test Admin'; email=$email; password='Secret123!'} | ConvertTo-Json
Write-Host "Attempting register for $email"
try {
  $res = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -Body $body -ContentType 'application/json' -ErrorAction Stop
  Write-Host "Success:" ($res | ConvertTo-Json)
} catch {
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    Write-Host "Error body:" $text
  } else {
    Write-Host "Exception:" $_.Exception.Message
  }
}
