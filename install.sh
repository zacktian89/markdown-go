#!/usr/bin/env bash

set -euo pipefail

SKIP_SKILL_INSTALL=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-skill-install)
      SKIP_SKILL_INSTALL=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Unsupported argument: $1" >&2
      exit 1
      ;;
  esac
done

log_step() {
  printf '\n==> %s\n' "$1"
}

run_cmd() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '[dry-run]'
    printf ' %q' "$@"
    printf '\n'
    return 0
  fi

  "$@"
}

node_major_version() {
  if ! command -v node >/dev/null 2>&1; then
    return 1
  fi

  node -p "process.versions.node.split('.')[0]"
}

node_and_npm_ready() {
  if ! command -v npm >/dev/null 2>&1; then
    return 1
  fi

  local major
  if ! major="$(node_major_version)"; then
    return 1
  fi

  [[ "$major" -ge 18 ]]
}

get_node_pkg_url() {
  local pkg_name
  pkg_name="$(
    curl -fsSL "https://nodejs.org/dist/latest-v22.x/" |
      tr '"' '\n' |
      grep -E '^node-v[0-9.]+\.pkg$' |
      head -n 1
  )"

  if [[ -z "$pkg_name" ]]; then
    echo "Could not find a macOS Node.js package." >&2
    return 1
  fi

  printf 'https://nodejs.org/dist/latest-v22.x/%s\n' "$pkg_name"
}

install_node_if_needed() {
  if node_and_npm_ready; then
    log_step "Node.js and npm are already available"
    return
  fi

  log_step "Installing Node.js LTS and npm"

  local installer_url installer_path
  installer_url="$(get_node_pkg_url)"
  installer_path="${TMPDIR:-/tmp}/markdown-go-node-lts.pkg"

  run_cmd curl -fsSL "$installer_url" -o "$installer_path"
  run_cmd sudo installer -pkg "$installer_path" -target /
}

install_markdown_go() {
  log_step "Installing markdown-go globally"
  run_cmd npm install -g @zacktian/markdown-go

  if [[ "$SKIP_SKILL_INSTALL" -eq 1 ]]; then
    return
  fi

  log_step "Installing the bundled skill"
  run_cmd npx -y @zacktian/markdown-go install-skill
}

log_step "Starting markdown-go installation"
install_node_if_needed
install_markdown_go

printf '\nInstallation complete.\n'
printf "If 'markdown-go' is not available in your current terminal yet, open a new terminal window and try again.\n"
