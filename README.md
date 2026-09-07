# FirmAudit

A persistent multi-agent firm with an onchain identity on Monad.
Every agent decision, every human approval, and every onchain execution is a
public receipt that any other protocol can read.

**Hackathon:** Monad Metropolis — Track 4 (Trust, Identity & AI Infrastructure)
**Network:** Monad testnet (chain id `10143`, RPC `https://testnet-rpc.monad.xyz`)
**Day 1 status:** closed. Three onchain events landed on one contract page.

## What FirmAudit is

A minimal write-only log with three events:

| Event              | Emitted by       | When                                            |
|--------------------|------------------|-------------------------------------------------|
| `DecisionProposed` | an agent EOA     | the agent proposes a decision keyed by `digest` |
| `ApprovalRecorded` | an approver EOA  | the approver approves (decision=1) or rejects   |
| `ActionExecuted`   | an agent EOA     | the agent posts the onchain tx hash that ran    |

The contract enforces the order (`proposed` → `approved` → `recordExecution`)
and the membership (`isAgent`, `isApprover`). It does NOT custody funds and
does NOT send the transfer — the human-approval safety property lives in
`scripts/execute.sh`, which refuses to broadcast the MON transfer unless
`approved[digest]` reads `true` on chain.

## The three commands

From `~/projects/firm-audit`, after `.env` is filled in:

```bash
source .env
DIGEST=$(cast keccak "demo-pay-50")

bash scripts/propose.sh    # DecisionProposed
bash scripts/approve.sh    # ApprovalRecorded
bash scripts/execute.sh    # 0.001 MON transfer + ActionExecuted
```

Each script wraps a single `cast send` (or `cast call` + `cast send` for
execute) against the contract at `$CONTRACT`.

## Day 1 receipts (Monad testnet)

**Contract:** `0x0ae52722d5180Cc99F205958A4a042cC3cD557BB`
Contract page (Events tab shows all three rows):
<https://testnet.monadvision.com/address/0x0ae52722d5180Cc99F205958A4a042cC3cD557BB>

| Step                  | Tx hash                                                              |
|-----------------------|----------------------------------------------------------------------|
| Deploy                | `0xd0fa7bb49dd35dd2722a5351965f9ee66a5d6ba5506e595777bf2735c3de63f4` |
| `DecisionProposed`    | `0xf6d0e55c732146014f10de2e45b1e3aab72f65b48c1684d22d80a6de396de0cf` |
| `ApprovalRecorded`    | `0x094e68b40869e251b4147208535537d5643e013cb46f9101224cfd9d1d435ba0` |
| `ActionExecuted`      | `0x9458e5a924419c91ebb22112e9e6b8d6097400c0137e2b9c870341e982bfee40` |
| MON transfer (PAY)    | `0x0901edac1c558f0e17a5aae935aa7a8cfb3c40af0b3b6cf48f05887a25c2f657` |

`ActionExecuted.data` carries the PAY tx hash, so the explorer links the
"we said we'd do it" event to the "we actually did it" tx.

Screenshot of the Events tab: `demo-events.png`.

## Repo hygiene

**Do not commit `.env`.** It holds the deployer private key.
`.gitignore` already excludes it, along with `out/`, `cache/`, `broadcast/`,
`lib/`. Verify with `git status` before every push.

## Next build (Day 2, not tonight)

One-page approve screen. Polls the contract for `DecisionProposed`, shows
Approve / Reject buttons, fires `scripts/execute.sh` on approve. No new
contract work, no smart accounts, no ENS — the loop on chain already exists.

## Day 2 — `ui/`

Next.js + viem. Reads only. No wallet, no private key.

```bash
cd ui
npm install
npm run dev
```

Open http://localhost:3000 (or 3001/3002/... if 3000 is busy — Next picks the
next free port).

The page renders every `DecisionProposed` log emitted by the contract in the
last ~5000 blocks, with one card per pending decision. Click **Approve**,
**Reject**, or **Execute** to reveal the exact `cast` command to run from
your shell. Signing happens there, where the key lives. Screenshot:
`ui-demo.png`. See [`ui/README.md`](ui/README.md).

## Day 3 — Hermes propose

Hermes (this orchestrator) is now an agent of the firm. Instead of a human
running `scripts/propose.sh` with a hardcoded digest, Hermes builds a fresh
unique digest (`hermes-pay-<unix-nanos>-<rand>`) and calls `propose()`
directly. Run it from anywhere in the repo:

```bash
bash scripts/hermes-propose.sh
```

Prints `DIGEST=` and `PROPOSE_TX=` on success. Retries once on revert (the
only realistic cause is a digest collision; the new digest includes
nanoseconds + a random suffix, so collisions are not expected in practice).
The contract, agent, approver, and amount are unchanged from Day 1 — this
is just a new caller for `propose()`.

## Day 4 — Closing the loop

Day 3's first Hermes proposal (`digest 0x3eb3967d…ce825`) was approved and
executed end-to-end:

- Approve: [`0xa0211c60…218ba`](https://testnet.monadvision.com/tx/0xa0211c6015914e246112bc187e1877c7986a577fc3431e03ec0c19e98a9218ba)
- MON transfer (PAY): [`0xd3bb3e34…2cc6f`](https://testnet.monadvision.com/tx/0xd3bb3e34641f59cb66bc8504a991cdd893b6aa6ad97b5a1326d160309712cc6f)
- recordExecution: [`0x8f576cec…2ef1a`](https://testnet.monadvision.com/tx/0x8f576cec140945a8ccf5f69401347f1e0733b2d159987499e9cea9f1a592ef1a)

`ActionExecuted.data` carries the PAY tx hash, so the onchain receipt links
the agent's "we said we'd do it" event to the "we actually did it" tx.
Confirmed onchain: `proposed[digest] = true`, `approved[digest] = true`.
No contract changes — the same `propose → recordApproval → execute` loop, with
Hermes on the propose side instead of a human running `scripts/propose.sh`.