#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

read_windows_env() {
  local key="$1"
  local scope="$2"
  powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('$key','$scope')" | tr -d '\r'
}

resolve_env() {
  local key="$1"
  local value=""

  value="$(read_windows_env "$key" "User")"
  if [[ -z "$value" ]]; then
    value="$(read_windows_env "$key" "Machine")"
  fi

  printf '%s' "$value"
}

NOTION_TOKEN="${NOTION_TOKEN:-$(resolve_env "NOTION_TOKEN")}"
NOTION_ROOT_PAGE_ID="${NOTION_ROOT_PAGE_ID:-$(resolve_env "NOTION_ROOT_PAGE_ID")}"

if [[ -z "$NOTION_TOKEN" || -z "$NOTION_ROOT_PAGE_ID" ]]; then
  echo "Missing NOTION_TOKEN or NOTION_ROOT_PAGE_ID."
  echo "- Windows User/Machine env vars를 설정하거나"
  echo "- 현재 WSL 세션에서 export 후 재실행하세요."
  exit 1
fi

export NOTION_TOKEN
export NOTION_ROOT_PAGE_ID

exec npm run sync:notion:ref -- "$@"
