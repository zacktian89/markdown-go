#!/usr/bin/env bash

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18+ is required. Install it first, then rerun this script." >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required but was not found. Ensure npm is installed with Node.js." >&2
  exit 1
fi

npx -y @zacktian/markdown-go install-skill "$@"
