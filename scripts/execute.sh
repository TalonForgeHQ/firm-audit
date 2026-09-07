#!/usr/bin/env bash
set -euo pipefail
source .env

APPROVED=$(cast call "$CONTRACT" "approved(bytes32)(bool)" "$DIGEST" --rpc-url "$RPC")
if [ "$APPROVED" != "true" ]; then
  echo "not approved"
  exit 1
fi

PAY_TX=$(cast send "$TARGET" --value 0.001ether --rpc-url "$RPC" --private-key "$PRIVATE_KEY" --json | jq -r .transactionHash)
echo "PAY_TX=$PAY_TX"

cast send "$CONTRACT" "recordExecution(bytes32,bytes32)" "$DIGEST" "$PAY_TX" \
  --rpc-url "$RPC" --private-key "$PRIVATE_KEY"