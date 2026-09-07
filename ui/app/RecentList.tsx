'use client';
import { useState } from 'react';
import { formatUnits } from 'viem';
import ApproveButtons from './ApproveButtons';

type Item = {
  digest: `0x${string}`;
  agent: string;
  target: string;
  amount: bigint;
  approved: boolean;
  executed: boolean;
  execTxHash?: `0x${string}`;
};

const trunc = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 2 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

export default function RecentList({ items, contract, rpc, agentId }: { items: Item[]; contract: `0x${string}`; rpc: string; agentId?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const explorer = `https://testnet.monadvision.com/address/${contract}`;
  const stateFor = (it: Item): 'pending' | 'approved' | 'executed' =>
    it.executed ? 'executed' : it.approved ? 'approved' : 'pending';
  const labelFor = (s: 'pending' | 'approved' | 'executed') =>
    s === 'executed' ? 'Executed' : s === 'approved' ? 'Approved' : 'Pending';
  return (
    <main className="container">
      <header>
        <div className="brand">
          <div className="dot" aria-hidden />
          <div>
            <div className="brand-name">FirmAudit</div>
            <div className="brand-tag">Talon · ERC-8004 #{agentId ?? '—'} · chain 10143</div>
          </div>
        </div>
        <h1>Onchain decisions,<br />approved by humans.</h1>
        <p className="subtitle">Talon proposes. Zinou approves. Monad records it.<br />Every agent decision, every approval, and every execution is a public receipt.</p>
        <div className="meta">
          <span><strong>Contract</strong> {trunc(contract, 8, 6)}</span>
          <span><strong>Decisions</strong> {items.length} recent</span>
          <span><strong>Explorer</strong> <a href={explorer} target="_blank" rel="noreferrer">testnet.monadvision.com</a></span>
        </div>
      </header>

      <p className="section-label">Recent decisions</p>

      {items.length === 0 && (
        <div className="empty">
          <div className="empty-icon">○</div>
          <div>No recent proposals.</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>Hermes can create one with <code>bash scripts/hermes-propose.sh</code>.</div>
        </div>
      )}

      {items.map((it) => {
        const isOpen = (k: string) => open === it.digest + ':' + k;
        const toggle = (k: string) => setOpen(isOpen(k) ? null : it.digest + ':' + k);
        const amount = formatUnits(it.amount, 18);
        const state = stateFor(it);
        return (
          <article key={it.digest} className="card">
            <div className="card-head">
              <div className="card-title">{it.digest}</div>
              <span className={`badge ${state}`}>{labelFor(state)}</span>
            </div>
            <div className="fields">
              <div className="field-label">Agent</div>
              <div className="field-value mono-strong">{trunc(it.agent, 10, 6)}</div>
              <div className="field-label">Target</div>
              <div className="field-value mono-strong">{trunc(it.target, 10, 6)}</div>
              <div className="field-label">Amount</div>
              <div className="field-value mono-strong">{amount} MON</div>
            </div>
            {(state === 'pending') && (
              <ApproveButtons digest={it.digest} contract={contract} rpc={rpc} />
            )}
            {(state === 'executed') && it.execTxHash && (
              <div className="wallet-ok" style={{ marginTop: 12, marginBottom: 12 }}>
                Execution tx <code>{trunc(it.execTxHash, 10, 6)}</code> —{' '}
                <a href={`https://testnet.monadvision.com/tx/${it.execTxHash}`} target="_blank" rel="noreferrer">view on explorer</a>
              </div>
            )}
            <div className="actions">
              <button className="btn execute" disabled={!it.approved || it.executed} onClick={() => toggle('x')}>Execute (script)</button>
            </div>
            {isOpen('x') && (
              <div className="command">
                <div className="command-label">Run in your shell · script verifies approved[digest], sends MON, records execution</div>
                {`cast call ${contract} "approved(bytes32)(bool)" ${it.digest} --rpc-url ${rpc}\n# if true:\nbash scripts/execute.sh   # sends 0.001 MON to ${trunc(it.target, 10, 6)}, then recordExecution`}
              </div>
            )}
          </article>
        );
      })}

      <footer className="footer">
        <span>Read-only by default. Connect MetaMask to sign Approve / Reject. Execute stays a script.</span>
        <span><a href="https://github.com/TalonForgeHQ/firm-audit" target="_blank" rel="noreferrer">github.com/TalonForgeHQ/firm-audit</a></span>
      </footer>
    </main>
  );
}