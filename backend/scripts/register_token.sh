#!/usr/bin/env bash
# Usage: ./register_token.sh <EXPO_PUSH_TOKEN>
TOKEN="$1"
if [ -z "$TOKEN" ]; then
  echo "Usage: $0 <EXPO_PUSH_TOKEN>"
  exit 1
fi
curl -s -X POST http://localhost:3000/api/v1/push/register -H "Content-Type: application/json" -d "{ \"token\": \"$TOKEN\" }" | jq
