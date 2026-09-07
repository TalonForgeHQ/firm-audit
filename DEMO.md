# FirmAudit — 3-minute demo video script

Target: judges. No narration over screen recordings of shell + browser.
Captions only where noted.

## 0:00 — Title card (5 sec)

`FirmAudit — Day 4 close. Three onchain events, one contract page.`

## 0:05 — The UI, idle (15 sec)

- Show `http://localhost:3000` (or 3001/3002/...) loaded in the browser.
- One card visible with the previous day's `DecisionProposed` (status ✅ approved).
- Caption: "Reads DecisionProposed events from the contract. No wallet, no key."

## 0:20 — Hermes proposes (20 sec)

- Switch to the shell at the repo root.
- Run: `bash scripts/hermes-propose.sh`
- Output: `DIGEST=0x…` and `PROPOSE_TX=0x…` printed.
- Caption: "Hermes is now an agent of the firm. Fresh digest, propose() called."

## 0:40 — UI refresh shows the new pending (15 sec)

- Switch back to the browser. Hard refresh (Cmd/Ctrl-R).
- A new card appears at the top with the digest Hermes just printed, status ⏳ pending.
- Caption: "The page polls the same contract. New decision shows up."

## 0:55 — Approve (20 sec)

- Back to the shell.
- Edit `DIGEST=` in `.env` to the value Hermes printed (or `export DIGEST=…`).
- Run: `bash scripts/approve.sh`
- Show the `status 1 (success)` line and the `transactionHash` line.
- Caption: "Approver signs recordApproval(digest, 1)."

## 1:15 — Execute (25 sec)

- In the same shell: `bash scripts/execute.sh`
- Show `PAY_TX=0x…` line.
- Show the second `cast send` for `recordExecution`, ending in `status 1 (success)`.
- Caption: "Script refuses to send MON unless approved[digest] is true onchain. Sends 0.001 MON, then records the execution with the PAY tx hash."

## 1:40 — Explorer Logs (60 sec)

- Open `https://testnet.monadvision.com/address/0x0ae52722d5180Cc99F205958A4a042cC3cD557BB` (or just the Events tab URL).
- Show the three new event rows for the digest Hermes proposed:
  - `DecisionProposed(agent, digest, target, amount)`
  - `ApprovalRecorded(approver, digest, decision=1)`
  - `ActionExecuted(agent, digest, txHash)`
- Click into the `ActionExecuted` row → show `data` = PAY tx hash.
- Click that PAY tx hash → show the 0.001 MON transfer.
- Caption: "Three receipts, one page. ActionExecuted.data links to the transfer tx."

## 2:40 — Closing card (20 sec)

- `Track 4 — Trust, Identity & AI Infrastructure`
- `Contract: 0x0ae52722d5180Cc99F205958A4a042cC3cD557BB`
- `Repo: https://github.com/TalonForgeHQ/firm-audit`
- `Agent card: /agent-card.json`

## Total: 3:00.

---

### Production notes

- Two windows side by side or hard cuts between shell and browser.
- Monospace font throughout; dark background matches the UI.
- No audio. Captions or on-screen labels only.
- Resize browser dev tools off; full screen.
- Pre-stage: a fresh Day-N demo. Run `forge test -vv` once before recording to prove the test passes (separate 10-sec clip before 0:00 if room allows).