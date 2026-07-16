#!/usr/bin/env bash

set -euo pipefail

FLOW_PATH="${1:-e2e/maestro/flows/smoke_auth.yaml}"
APP_ID="${MAESTRO_APP_ID:-com.lindsea89.resilientportfolio}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI is required. Install it first: https://maestro.mobile.dev/getting-started/installing-maestro"
  exit 1
fi

if [ ! -f "$FLOW_PATH" ]; then
  echo "Maestro flow not found: $FLOW_PATH"
  exit 1
fi

echo "Running Maestro flow: $FLOW_PATH (appId=$APP_ID)"
maestro test "$FLOW_PATH" -e MAESTRO_APP_ID="$APP_ID"
