Set-ExecutionPolicy -Scope Process Bypass -Force
$ErrorActionPreference = 'Stop'

$Backend = Join-Path $HOME 'Desktop\StyleForgeAI\backend'
$Models = Join-Path $Backend 'models'
New-Item -ItemType Directory -Force -Path $Models | Out-Null

$assets = @{
    'vgg_normalised.pth' = 'https://github.com/naoto0804/pytorch-AdaIN/releases/download/v0.1/vgg_normalised.pth'
    'decoder.pth' = 'https://github.com/naoto0804/pytorch-AdaIN/releases/download/v0.1/decoder.pth'
}

foreach ($name in $assets.Keys) {
    $url = $assets[$name]
    $destination = Join-Path $Models $name

    Write-Host "Checking official asset: $name" -ForegroundColor Cyan

    try {
        Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 30 -ErrorAction Stop | Out-Null
    }
    catch {
        throw "Official asset URL is unavailable: $url. Check https://github.com/naoto0804/pytorch-AdaIN and its README/release assets. No substitute URL was guessed."
    }

    if (Test-Path $destination) {
        Write-Host "$name already exists." -ForegroundColor Green
        continue
    }

    $downloaded = $false

    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Write-Host "Downloading $name (attempt $attempt/3)..."
            Invoke-WebRequest -Uri $url -OutFile $destination -TimeoutSec 600
            if ((Get-Item $destination).Length -lt 1024) {
                throw "Downloaded file is unexpectedly small."
            }
            $downloaded = $true
            break
        }
        catch {
            Remove-Item $destination -Force -ErrorAction SilentlyContinue
            if ($attempt -eq 3) { throw "Download failed for $name. $($_.Exception.Message)" }
            Start-Sleep -Seconds 3
        }
    }

    if (!$downloaded) { throw "Could not download $name." }
}

Write-Host "Both model files are ready." -ForegroundColor Green
