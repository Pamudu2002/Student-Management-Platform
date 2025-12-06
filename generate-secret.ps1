# Generate a secure NEXTAUTH_SECRET
$randomBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($randomBytes)
$secret = [Convert]::ToBase64String($randomBytes)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "NEXTAUTH_SECRET Generator" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your secure NEXTAUTH_SECRET:" -ForegroundColor Green
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy this value to your .env.local file:" -ForegroundColor White
Write-Host "NEXTAUTH_SECRET=$secret" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
