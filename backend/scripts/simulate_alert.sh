#!/usr/bin/env bash
# Usage: ./simulate_alert.sh <SCANNED_VALUE>
SCANNED="$1"
if [ -z "$SCANNED" ]; then
  echo "Usage: $0 <SCANNED_VALUE>"
  exit 1
fi
curl -s -X POST http://localhost:3000/api/v1/push/simulate -H "Content-Type: application/json" -d "{ \"scannedValue\": \"$SCANNED\" }" | jq
