# ui/

One-page approval UI for FirmAudit on Monad testnet.
Next.js + viem. Reads only. No wallet, no private key.

## Setup

```bash
cd ui
npm install
cp .env.local .env.local.bak   # optional: backup before editing
# edit .env.local — already has NEXT_PUBLIC_RPC and NEXT_PUBLIC_CONTRACT
# (no PRIVATE_KEY in this directory, by design)
npm run dev
```

Open http://localhost:3000.

## What it does

The page server-fetches every `DecisionProposed` log emitted by the contract
in the last ~10k blocks (Monad testnet = ~67 minutes at 400ms blocks), reads
`approved[digest]` for each, and renders one card per pending decision.

Buttons reveal the exact `cast send` command to run from your shell. Nothing
is signed in the browser — you copy-paste into the shell that holds the
approver key.

| Button  | Cast call                                                          |
|---------|--------------------------------------------------------------------|
| Approve | `cast send $CONTRACT "recordApproval(bytes32,uint8)" $DIGEST 1`    |
| Reject  | `cast send $CONTRACT "recordApproval(bytes32,uint8)" $DIGEST 0`    |
| Execute | `bash scripts/execute.sh` (after `approved[digest] == true`)       |

## Day 2 deliverable

~150 lines of code, no DB, no auth. The safety property still lives in
`scripts/execute.sh` and on chain — the UI just surfaces pending work.