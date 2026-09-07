#!/usr/bin/env bash
set -euo pipefail

# ensure forge + jq are on PATH (non-interactive bash doesn't source ~/.bashrc)
export PATH="$HOME/.foundry/bin:$HOME/bin:$PATH"

source .env

# Send propose() with a fresh unique digest. Retry once on revert
# (already-used digest is the only realistic revert cause here).
attempt() {
  local UNIQ="hermes-pay-$(date +%s%N)-$RANDOM"
  local D
  D=$(cast keccak "$UNIQ")
  local TX
  if TX=$(cast send "$CONTRACT" "propose(bytes32,address,uint256)" "$D" "$TARGET" "$AMOUNT" \
    --rpc-url "$RPC" --private-key "$PRIVATE_KEY" --json 2>/dev/null \
    | jq -r .transactionHash); then
    printf '%s:%s\n' "$D" "$TX"
    return 0
  fi
  return 1
}

for i in 1 2; do
  if result=$(attempt); then
    DIGEST=${result%:*}
    PROPOSE_TX=${result#*:}
    echo "DIGEST=$DIGEST"
    echo "PROPOSE_TX=$PROPOSE_TX"
    exit 0
  fi
  echo "attempt $i reverted, retrying with new digest"
done
echo "both attempts reverted"
exit 1