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
};

const trunc = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 2 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

export default function PendingList({ items, contract, rpc, agentId }: { items: Item[]; contract: `0x${string}`; rpc: string; agentId?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const explorer = `https://testnet.monadvision.com/address/${contract}`;
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
          <span><strong>Events</strong> {items.length} found</span>
          <span><strong>Explorer</strong> <a href={explorer} target="_blank" rel="noreferrer">testnet.monadvision.com</a></span>
        </div>
      </header>

      <p className="section-label">Pending decisions</p>

      {items.length === 0 && (
        <div className="empty">
          <div className="empty-icon">○</div>
          <div>No DecisionProposed events in the last ~5000 blocks.</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>Run <code>bash scripts/hermes-propose.sh</code> to create one.</div>
        </div>
      )}

      {items.map((it) => {
        const isOpen = (k: string) => open === it.digest + ':' + k;
        const toggle = (k: string) => setOpen(isOpen(k) ? null : it.digest + ':' + k);
        const amount = formatUnits(it.amount, 18);
        return (
          <article key={it.digest} className="card">
            <div className="card-head">
              <div className="card-title">{it.digest}</div>
              <span className={`badge ${it.approved ? 'approved' : 'pending'}`}>
                {it.approved ? 'Approved' : 'Pending'}
              </span>
            </div>
            <div className="fields">
              <div className="field-label">Agent</div>
              <div className="field-value mono-strong">{trunc(it.agent, 10, 6)}</div>
              <div className="field-label">Target</div>
              <div className="field-value mono-strong">{trunc(it.target, 10, 6)}</div>
              <div className="field-label">Amount</div>
              <div className="field-value mono-strong">{amount} MON</div>
            </div>
            {!it.approved && <ApproveButtons digest={it.digest} contract={contract} rpc={rpc} />}
            <div className="actions">
              <button className="btn execute" disabled={!it.approved} onClick={() => toggle('x')}>Execute (script)</button>
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