param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$InstallerArgs
)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js 18+ is required. Install it first, then rerun this script."
  exit 1
}

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Error "npx is required but was not found. Ensure npm is installed with Node.js."
  exit 1
}

& npx -y @zacktian/markdown-go install-skill @InstallerArgs
exit $LASTEXITCODE
