<#
.SYNOPSIS
  Start or update the operations stack on this computer (ADR-060): QOR ID, its
  Postgres and Redis, and Woodpecker CI, published by a Cloudflare Tunnel.

.DESCRIPTION
  Secrets live in %LOCALAPPDATA%\qor-ops\.env, outside the repository.
  - The database password, the JWT secrets and the Woodpecker agent secret are
    generated here the first time.
  - The GitHub OAuth app's client ID and secret are asked for the first time,
    typed by the owner, and never printed.
  - The Cloudflare tunnel `qor-ops` is made the first time with cloudflared (it
    needs `cloudflared tunnel login` done once), routed to id.qorsync.dev and
    ci.qorsync.dev, and its credentials kept in %LOCALAPPDATA%\qor-ops\cloudflared.
  Then `docker compose up -d --build` in infra/ops.

.EXAMPLE
  powershell -File infra/ops/start-ops.ps1
  powershell -File infra/ops/start-ops.ps1 -Stop
#>
param([switch]$Stop)

# Native tools (docker) write routine notices to stderr, which Windows PowerShell
# 5 turns into errors; this script stops only on its own checks, by throwing.
$ErrorActionPreference = 'Continue'

$dir = Join-Path $env:LOCALAPPDATA 'qor-ops'
$envFile = Join-Path $dir '.env'
$compose = @('compose', '--project-directory', $PSScriptRoot, '-f', (Join-Path $PSScriptRoot 'compose.yaml'), '--env-file', $envFile)

if ($Stop) {
  docker @compose down
  return
}

New-Item -ItemType Directory -Force -Path $dir | Out-Null
$values = [ordered]@{}
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    $k, $v = $line -split '=', 2
    if ($k) { $values[$k] = $v }
  }
}

function New-Secret { -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }) }
function Read-Secret($prompt) {
  $secure = Read-Host $prompt -AsSecureString
  [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

foreach ($k in 'POSTGRES_PASSWORD', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'WOODPECKER_AGENT_SECRET') {
  if (-not $values[$k]) { $values[$k] = New-Secret }
}
$values['QOR_OPS_DIR'] = $dir

# The tunnel, made once. cloudflared keeps its credentials beside its login
# certificate in ~/.cloudflared; they are copied to where the container reads them.
$tunnelDir = Join-Path $dir 'cloudflared'
New-Item -ItemType Directory -Force -Path $tunnelDir | Out-Null
$config = Join-Path $tunnelDir 'config.yml'
# A config without a tunnel ID was left by a run that could not reach cloudflared.
if ((Test-Path $config) -and -not (Select-String -Quiet -Path $config -Pattern '^tunnel: \S')) {
  Remove-Item $config
}
if (-not (Test-Path $config)) {
  # A terminal opened before cloudflared was installed does not have it on PATH.
  $cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
  if (-not $cloudflared) {
    $cloudflared = @("${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe", "$env:ProgramFiles\cloudflared\cloudflared.exe") |
      Where-Object { Test-Path $_ } | Select-Object -First 1
  }
  if (-not $cloudflared) {
    throw 'cloudflared is not installed: winget install --id Cloudflare.cloudflared -e, then run this again.'
  }
  if (-not (Test-Path (Join-Path $HOME '.cloudflared\cert.pem'))) {
    throw 'Run `cloudflared tunnel login` once and choose qorsync.dev, then run this again.'
  }
  $existing = & $cloudflared tunnel list --name qor-ops --output json | ConvertFrom-Json
  if (-not $existing) { & $cloudflared tunnel create qor-ops | Out-Host }
  $id = (& $cloudflared tunnel list --name qor-ops --output json | ConvertFrom-Json)[0].id
  if (-not $id) { throw 'The tunnel qor-ops could not be created or found. See the output above.' }
  Copy-Item (Join-Path $HOME ".cloudflared\$id.json") (Join-Path $tunnelDir "$id.json")
  foreach ($name in 'id.qorsync.dev', 'ci.qorsync.dev') {
    & $cloudflared tunnel route dns --overwrite-dns qor-ops $name | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "The DNS record for $name was not made. See the output above." }
  }
  @(
    "tunnel: $id"
    "credentials-file: /etc/cloudflared/$id.json"
    'ingress:'
    '  - hostname: id.qorsync.dev'
    '    service: http://qor-auth:8080'
    '  - hostname: ci.qorsync.dev'
    '    service: http://woodpecker-server:8000'
    '  - service: http_status:404'
  ) | Set-Content -Encoding ascii $config
}
if (-not $values['WOODPECKER_GITHUB_CLIENT']) {
  $values['WOODPECKER_GITHUB_CLIENT'] = Read-Host 'GitHub OAuth app Client ID (infra/ops/README.md, step 4)'
}
if (-not $values['WOODPECKER_GITHUB_SECRET']) {
  $values['WOODPECKER_GITHUB_SECRET'] = Read-Secret 'GitHub OAuth app client secret'
}

($values.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) | Set-Content -Encoding ascii $envFile
# Only this Windows account may read it.
icacls $envFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Docker is not running. Start Docker Desktop and run this again.' }

docker @compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'The stack did not start. See the output above.' }
docker @compose ps
Write-Host 'Started. https://id.qorsync.dev/health and https://ci.qorsync.dev answer once the tunnel is connected.'
