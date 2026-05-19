#Requires -Version 5.1
# encoding: utf8

param(
    [string]$OutputDir = (Join-Path $PSScriptRoot '..\..\dist-portable'),
    [switch]$Standalone
)

$ErrorActionPreference = 'Stop'

$source = Join-Path $PSScriptRoot 'CostDashboardLauncher.cs'
$icon = Join-Path $PSScriptRoot 'CostDashboard.ico'
$resolvedOutputDir = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDir)
$output = Join-Path $resolvedOutputDir 'Cost-Dashboard.exe'

$packageJsonPath = Join-Path $PSScriptRoot '..\..\package.json'
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$version = $packageJson.version.Trim()

Write-Host "Building launcher with version: $version"

function New-LauncherIcon {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    Add-Type -AssemblyName System.Drawing

    $size = 64
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $backgroundPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $backgroundRect = New-Object System.Drawing.Rectangle 4, 4, 56, 56
    $radius = 14
    $diameter = $radius * 2
    $backgroundPath.AddArc($backgroundRect.X, $backgroundRect.Y, $diameter, $diameter, 180, 90)
    $backgroundPath.AddArc($backgroundRect.Right - $diameter, $backgroundRect.Y, $diameter, $diameter, 270, 90)
    $backgroundPath.AddArc($backgroundRect.Right - $diameter, $backgroundRect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $backgroundPath.AddArc($backgroundRect.X, $backgroundRect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $backgroundPath.CloseFigure()

    $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($backgroundRect, [System.Drawing.Color]::FromArgb(255, 37, 99, 235), [System.Drawing.Color]::FromArgb(255, 96, 165, 250), [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    $graphics.FillPath($backgroundBrush, $backgroundPath)

    $fontFamily = $null
    foreach ($candidate in @('Microsoft YaHei UI', 'Microsoft YaHei', 'SimHei', 'Arial')) {
        try {
            $fontFamily = New-Object System.Drawing.FontFamily $candidate
            break
        } catch {
            $fontFamily = $null
        }
    }
    if ($null -eq $fontFamily) {
        $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    }
    $font = New-Object System.Drawing.Font $fontFamily, 34, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF 4, 2, 56, 56
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 30, 58, 138))
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

    $shadowRect = New-Object System.Drawing.RectangleF 4, 5, 56, 56
    $graphics.DrawString([char]0x4E91, $font, $shadowBrush, $shadowRect, $format)
    $graphics.DrawString([char]0x4E91, $font, $textBrush, $textRect, $format)

    $iconHandle = $bitmap.GetHicon()
    $generatedIcon = [System.Drawing.Icon]::FromHandle($iconHandle)
    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Create)
    try {
        $generatedIcon.Save($stream)
    } finally {
        $stream.Dispose()
        $generatedIcon.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
        $backgroundBrush.Dispose()
        $font.Dispose()
        if ($fontFamily -ne [System.Drawing.FontFamily]::GenericSansSerif) {
            $fontFamily.Dispose()
        }
        $format.Dispose()
        $shadowBrush.Dispose()
        $textBrush.Dispose()
        $backgroundPath.Dispose()
    }
}

if (!(Test-Path $resolvedOutputDir)) {
    New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null
}

if (Test-Path $output) {
    Remove-Item $output -Force
}

New-LauncherIcon -Path $icon

$cscPath = Join-Path $env:SystemRoot 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (!(Test-Path $cscPath)) {
    $cscPath = Join-Path $env:SystemRoot 'Microsoft.NET\Framework\v4.0.30319\csc.exe'
}

$tempSource = Join-Path $resolvedOutputDir 'CostDashboardLauncher.cs.tmp'
$sourceContent = Get-Content $source -Raw -Encoding UTF8
$sourceContent = $sourceContent.Replace('__VERSION__', $version)
[System.IO.File]::WriteAllText($tempSource, $sourceContent, [System.Text.Encoding]::UTF8)

$assemblyInfoTemplate = Join-Path $PSScriptRoot 'AssemblyInfo.cs'
$tempAssemblyInfo = Join-Path $resolvedOutputDir 'AssemblyInfo.cs.tmp'
$assemblyInfoContent = Get-Content $assemblyInfoTemplate -Raw
$assemblyInfoContent = $assemblyInfoContent.Replace('__VERSION__', $version)
$assemblyInfoContent = $assemblyInfoContent.Replace('__COPYRIGHT_YEAR__', (Get-Date).Year.ToString())
$assemblyInfoContent = $assemblyInfoContent.Replace('__GUID__', [guid]::NewGuid().ToString())
[System.IO.File]::WriteAllText($tempAssemblyInfo, $assemblyInfoContent, [System.Text.Encoding]::UTF8)

& $cscPath /target:winexe /out:"$output" /win32icon:"$icon" /reference:System.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll "$tempSource" "$tempAssemblyInfo"

Remove-Item $tempSource -Force
Remove-Item $tempAssemblyInfo -Force

Write-Host "Launcher built: $output"

if ($Standalone) {
    Write-Host ""
    Write-Host "=== Building Standalone EXE ==="

    $tempExePath = Join-Path $env:TEMP 'Cost-Dashboard-Standalone.tmp.exe'
    Copy-Item -Path $output -Destination $tempExePath -Force

    $zipPath = Join-Path $env:TEMP "CostDashboard-payload-$version.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

    Write-Host "[1/3] Creating payload zip from portable files..."
    $excludePatterns = @('Cost-Dashboard.exe', 'tools')
    $includeItems = Get-ChildItem -LiteralPath $resolvedOutputDir | Where-Object {
        $name = $_.Name
        $excludePatterns -notcontains $name
    }
    Compress-Archive -Path $includeItems.FullName -DestinationPath $zipPath -Force

    Write-Host "[2/3] Appending payload to exe..."
    $zipStream = [System.IO.File]::OpenRead($zipPath)
    $exeStream = New-Object System.IO.FileStream($tempExePath, 'Append', 'Write', 'None')

    $buffer = New-Object byte[] 81920
    while ($true) {
        $read = $zipStream.Read($buffer, 0, $buffer.Length)
        if ($read -eq 0) { break }
        $exeStream.Write($buffer, 0, $read)
    }

    $sizeBytes = [System.BitConverter]::GetBytes([int64]$zipStream.Length)
    $magicBytes = [System.Text.Encoding]::ASCII.GetBytes('CDSE')
    $exeStream.Write($sizeBytes, 0, 8)
    $exeStream.Write($magicBytes, 0, 4)

    $exeStream.Close()
    $zipStream.Close()

    Write-Host "[3/3] Finalizing..."
    Remove-Item $zipPath -Force
    Move-Item -Path $tempExePath -Destination $output -Force

    $exeSize = [math]::Round((Get-Item $output).Length / 1MB, 1)
    Write-Host "Standalone exe created: $output ($exeSize MB)"
    Write-Host "=== Standalone EXE Built ==="
}
