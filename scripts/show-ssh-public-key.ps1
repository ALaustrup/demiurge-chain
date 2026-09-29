# Display SSH Public Key for Adding to Server
# Usage: .\scripts\show-ssh-public-key.ps1

$SSH_DIR = Join-Path $env:USERPROFILE ".ssh"
$keyName = "id_ed25519_pleroma"
$publicKeyPath = Join-Path $SSH_DIR "$keyName.pub"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SSH PUBLIC KEY FOR SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if key exists
if (Test-Path $publicKeyPath) {
    $publicKey = Get-Content $publicKeyPath -Raw
    $publicKey = $publicKey.Trim()
    
    Write-Host "Public Key Location: $publicKeyPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Copy this key and add it to the server:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $publicKey -ForegroundColor Green
    Write-Host ""
    
    # Copy to clipboard
    $publicKey | Set-Clipboard
    Write-Host "Key copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "On the server, add this key to:" -ForegroundColor Blue
    Write-Host "  ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or run this command on the server:" -ForegroundColor Blue
    Write-Host "  echo '$publicKey' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
    Write-Host "  chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
    Write-Host "  chmod 700 ~/.ssh" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host "Public key not found at: $publicKeyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available keys:" -ForegroundColor Yellow
    $keys = Get-ChildItem $SSH_DIR -Filter "*.pub" -ErrorAction SilentlyContinue
    if ($keys) {
        foreach ($key in $keys) {
            Write-Host "  - $($key.Name)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "To use a different key, specify:" -ForegroundColor Yellow
        Write-Host "  Get-Content $SSH_DIR\<keyname>.pub" -ForegroundColor Cyan
    } else {
        Write-Host "  No public keys found in $SSH_DIR" -ForegroundColor Red
        Write-Host ""
        Write-Host "Generate a new key:" -ForegroundColor Yellow
        Write-Host "  .\scripts\setup-ssh-keys.ps1" -ForegroundColor Cyan
    }
}

Write-Host ""
