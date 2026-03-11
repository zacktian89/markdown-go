param(
  [switch]$SkipSkillInstall,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-LoggedCommand {
  param(
    [string]$Preview,
    [scriptblock]$Action
  )

  if ($DryRun) {
    Write-Host "[dry-run] $Preview" -ForegroundColor Yellow
    return
  }

  & $Action
}

function Update-PathForCurrentSession {
  $candidates = @(
    (Join-Path ${env:ProgramFiles} "nodejs"),
    (Join-Path ${env:APPDATA} "npm")
  ) | Where-Object { $_ -and (Test-Path $_) }

  foreach ($candidate in $candidates) {
    if (-not (($env:Path -split ";") -contains $candidate)) {
      $env:Path = "$candidate;$env:Path"
    }
  }
}

function Get-NodeMajorVersion {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    return $null
  }

  try {
    return [int](& node -p "process.versions.node.split('.')[0]")
  }
  catch {
    return $null
  }
}

function Test-NodeAndNpmReady {
  $nodeMajor = Get-NodeMajorVersion
  if ($null -eq $nodeMajor -or $nodeMajor -lt 18) {
    return $false
  }

  return [bool](Get-Command npm -ErrorAction SilentlyContinue)
}

function Get-NodeInstallerUrl {
  $listing = Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/latest-v22.x/"
  $link = $listing.Links |
    Where-Object { $_.href -match '^node-v[\d\.]+-x64\.msi$' } |
    Select-Object -First 1 -ExpandProperty href

  if (-not $link) {
    throw "Could not find a Node.js LTS MSI installer."
  }

  return "https://nodejs.org/dist/latest-v22.x/$link"
}

function Install-NodeIfNeeded {
  if (Test-NodeAndNpmReady) {
    Write-Step "Node.js and npm are already available"
    return
  }

  Write-Step "Installing Node.js LTS and npm"
  $installerUrl = Get-NodeInstallerUrl
  $installerPath = Join-Path $env:TEMP "markdown-go-node-lts-x64.msi"

  Invoke-LoggedCommand "Download Node.js installer from $installerUrl" {
    Invoke-WebRequest -UseBasicParsing -Uri $installerUrl -OutFile $installerPath
  }

  Invoke-LoggedCommand "Run msiexec for $installerPath" {
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList @(
      "/i",
      $installerPath,
      "/qn",
      "/norestart"
    ) -PassThru -Wait -NoNewWindow

    if ($process.ExitCode -ne 0) {
      throw "Node.js installer exited with code $($process.ExitCode)."
    }
  }

  if (-not $DryRun) {
    Update-PathForCurrentSession
  }

  if (-not $DryRun -and -not (Test-NodeAndNpmReady)) {
    throw "Node.js installation finished, but node/npm are still unavailable in this session."
  }
}

function Install-MarkdownGo {
  Write-Step "Installing markdown-go globally"
  Invoke-LoggedCommand "npm install -g @zacktian/markdown-go" {
    & npm install -g @zacktian/markdown-go
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed with exit code $LASTEXITCODE."
    }
  }

  if ($SkipSkillInstall) {
    return
  }

  Write-Step "Installing the bundled skill"
  Invoke-LoggedCommand "npx -y @zacktian/markdown-go install-skill" {
    & npx -y @zacktian/markdown-go install-skill
    if ($LASTEXITCODE -ne 0) {
      throw "Skill installation failed with exit code $LASTEXITCODE."
    }
  }
}

Write-Step "Starting markdown-go installation"
Install-NodeIfNeeded
Install-MarkdownGo

Write-Host ""
Write-Host "Installation complete." -ForegroundColor Green
Write-Host "If 'markdown-go' is not available in your current terminal yet, open a new terminal window and try again."
