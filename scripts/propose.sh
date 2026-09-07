#!/usr/bin/env bash
set -euo pipefail
source .env
cast send "$CONTRACT" "propose(bytes32,address,uint256)" "$DIGEST" "$TARGET" "$AMOUNT" \
  --rpc-url "$RPC" --private-key "$PRIVATE_KEY"