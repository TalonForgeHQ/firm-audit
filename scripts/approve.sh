#!/usr/bin/env bash
set -euo pipefail
source .env
cast send "$CONTRACT" "recordApproval(bytes32,uint8)" "$DIGEST" 1 \
  --rpc-url "$RPC" --private-key "$PRIVATE_KEY"