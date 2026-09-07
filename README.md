# FirmAudit

A persistent multi-agent firm with an onchain identity on Monad.
Every agent decision, every human approval, and every onchain execution is a
public receipt that any other protocol can read.

**Hackathon:** Monad Metropolis — Track 4 (Trust, Identity & AI Infrastructure)
**Network:** Monad testnet (chain id `10143`, RPC `https://testnet-rpc.monad.xyz`)
**Day 7 status:** closed. Contract live, three onchain events, Sourcify
verified `exact_match`, agent registered in ERC-8004 IdentityRegistry as
**agentId 1825**.

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

## Day 5 — Identity + demo

- **`agent-card.json`** at the repo root — ERC-8004-style card for the agent
  wallet. `name=Talon`, `role=agent`, `address`, `chainId`, `contract`,
  `abilities: [propose]`, `endpoints.github` = this repo.
- **`DEMO.md`** — 3-minute video script. UI idle → `hermes-propose.sh` → UI
  refresh → `approve.sh` → `execute.sh` → explorer Logs (one page, three
  events). Captions only; no narration.
- **Sourcify verification:** the contract is verified on Sourcify against
  Monad testnet (chain 10143) as `exact_match` for both creation and runtime.
  Proof: <https://sourcify.dev/contracts/10143/0x0ae52722d5180Cc99F205958A4a042cC3cD557BB>
  (also dumped to `sourcify-proof.json`). Reproduce with:

  ```bash
  forge verify-contract 0x0ae52722d5180Cc99F205958A4a042cC3cD557BB \
    src/FirmAudit.sol:FirmAudit \
    --verifier sourcify --chain 10143 \
    --creation-transaction-hash 0xd0fa7bb49dd35dd2722a5351965f9ee66a5d6ba5506e595777bf2735c3de63f4 \
    --compiler-version 0.8.36 --num-of-optimizations 200
  ```

  No contract changes. ERC-8004 registration on chain 10143 was deferred at
  Day 5 because the docs address `0x8004A169…432` was unverified for
  testnet — see Day 7 below for the resolution.

## Day 7 — ERC-8004 IdentityRegistry registration

Talon is now registered in the ERC-8004 IdentityRegistry on Monad testnet
(chain 10143):

- **Registry:** [`0x8004A818BFB912233c491871b3d84c89A494BD9e`](https://testnet.monadvision.com/address/0x8004A818BFB912233c491871b3d84c89A494BD9e)
- **agentId:** `1825`
- **Owner:** `0xc5cD2152C1A6B016aB9af9B5b3733Af62eB47cF8`
- **agentURI:** `https://raw.githubusercontent.com/TalonForgeHQ/firm-audit/main/agent-card.json`
- **Register tx:** [`0x10c8935fcfcb62f5d7beaaddf805115e8c21878f20454f89c67f96b4a7713aa4`](https://testnet.monadvision.com/tx/0x10c8935fcfcb62f5d7beaaddf805115e8c21878f20454f89c67f96b4a7713aa4)

The agent card at the URI is the same JSON in `agent-card.json` at the repo
root — `name`, `role`, `address`, `chainId`, `contract`, `abilities`,
`endpoints`. ERC-721 `Transfer(0x0 → 0xc5cD…, 1825)` confirms the mint;
`ownerOf(1825)` and `tokenURI(1825)` re-reads return the agent EOA and the
agentURI string respectively.

The onchain call:

```bash
cast send 0x8004A818BFB912233c491871b3d84c89A494BD9e \
  "register(string)" \
  "https://raw.githubusercontent.com/TalonForgeHQ/firm-audit/main/agent-card.json" \
  --rpc-url "$RPC" --private-key "$PRIVATE_KEY"
```

No ETH value required — `register()` is non-payable. ReputationRegistry
interaction is deferred per scope. **No other features this turn.**

> Note: the Monad docs page lists the IdentityRegistry address as
> `0x8004A169…432` (monadvision.com auto-resolves to **mainnet**). On
> **testnet** (chain 10143) that address has no deployed code. The
> working testnet address `0x8004A818…BD9e` was provided directly and is
> what we registered against.

## Day 8 — First MetaMask approve + close the loop end-to-end

Hermes proposed digest `0x42c5f121…de33611` via `scripts/hermes-propose.sh`.
Zinou approved it from the UI through MetaMask (no private key in the
browser):

- Approve tx: [`0x30a6aad8…21fa2`](https://testnet.monadvision.com/tx/0x30a6aad8c21fa2)

The UI card flipped from `PENDING` to `APPROVED` on next refresh. Then
`scripts/execute.sh` ran with `DIGEST=0x42c5f121…de33611`:

- MON transfer (PAY): [`0x186c4dcc…add41`](https://testnet.monadvision.com/tx/0x186c4dcc2cd1d746940f8515cae228b7acf13a71d5c7e2f13f1b0c68be1add41)
- recordExecution: [`0xebbdaeca…c997`](https://testnet.monadvision.com/tx/0xebbdaeca3fa2a882478719c61d660705ee49502a8d103957fe6efb7736d8c997)

`ActionExecuted.data` carries the PAY tx hash. This is the same three-event
loop as Day 1, but the **approve** is now signed by MetaMask through wagmi
in the browser, not by `cast send` in a shell. The contract, scripts,
.env, and agent EOA are unchanged.

Screenshots:
- `metamask-day-8-tx-request.png` — MetaMask transaction request for `recordApproval`
- `metamask-day-8-tx-confirmed.png` — UI showing `Sent ✓ tx 0x30a6aad8…` + "Confirmed" Brave toast
- `metamask-day-8-approved.png` — UI card after refresh, badge = `APPROVED`